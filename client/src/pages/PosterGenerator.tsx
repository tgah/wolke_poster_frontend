import { useState, useRef, useEffect } from "react";
import { useCreatePoster, exportPoster, type ProductInput } from "@/hooks/use-posters";
import { useImportProducts } from "@/hooks/use-products";
import { useBackgrounds } from "@/hooks/use-backgrounds";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Download, Loader2, Check, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

type Template = {
  key: "two_product" | "three_product";
  label: string;
  max_products: number;
};

const templates: Template[] = [
  { key: "two_product", label: "2 Products", max_products: 2 },
  { key: "three_product", label: "3 Products", max_products: 3 },
];

function createEmptyProduct(): ProductInput {
  return {
    artikelNr: "",
    image: null,
  };
}

// Step 3: ProductInput component for dynamic rendering
function ProductInput({
  index,
  value,
  onChange,
  toast,
}: {
  index: number;
  value: ProductInput;
  onChange: (updated: ProductInput) => void;
  toast: any;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = async () => {
    // Copy article number to clipboard if it exists
    if (value.artikelNr.trim()) {
      try {
        await navigator.clipboard.writeText(value.artikelNr);
        toast({
          title: "Article number copied to clipboard",
          description: `${value.artikelNr} is ready to paste`,
        });
      } catch (error) {
        // Fallback if clipboard API fails
        console.warn('Clipboard write failed:', error);
      }
    }
    
    // Trigger file dialog
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Article #{index + 1}</Label>
          <Input
            value={value.artikelNr}
            readOnly
            placeholder=""
            className="text-xs bg-white"
          />
        </div>

        {/* Price field removed (no longer required) */}
        <div className="space-y-1.5 flex-none">
          <Label className="text-xs text-muted-foreground opacity-0 select-none">.</Label>
          <Button
            variant="outline"
            size="sm"
            className="w-[150px] text-xs"
            onClick={handleUploadClick}
            disabled={!value.artikelNr.trim()}
            title={!value.artikelNr.trim() ? "Import CSV to auto-fill article numbers first" : undefined}
          >
            {value.image ? "✓ Image" : "Upload Image"}
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onChange({ ...value, image: file });
          }
        }}
      />
    </div>
  );
}

export default function PosterGenerator() {
  const { backgrounds, generateBackground, uploadBackground, isGenerating, isUploading } = useBackgrounds();
  const { mutate: createPoster, isPending: isCreating } = useCreatePoster();
  const { mutate: importProducts, isPending: isImporting } = useImportProducts();
  const { toast } = useToast();

  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  const [templateKey, setTemplateKey] = useState<"two_product" | "three_product">("two_product");
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string | null>(null);
  const [saleTitle, setSaleTitle] = useState("Summer Sale");
  const [themeText, setThemeText] = useState("Summer beach vibes");
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Step 2: Normalize product state to an array
  const [products, setProducts] = useState<ProductInput[]>([]);

  // Step 1: Ensure selected template exposes max_products
  const selectedTemplate = templates.find(t => t.key === templateKey);

  // Step 2: On template change, normalize product array
  useEffect(() => {
    if (!selectedTemplate) return;
    
    setProducts(prev =>
      Array.from({ length: selectedTemplate.max_products }, (_, i) =>
        prev[i] ?? createEmptyProduct()
      )
    );
  }, [selectedTemplate]);

  // Auto-select newly generated backgrounds for better UX
  useEffect(() => {
    if (!backgrounds.length) return;

    // Find the most recent ready background
    const latestReady = [...backgrounds]
      .reverse()
      .find(bg => bg.status === "ready");

    if (!latestReady) return;

    // Auto-select if nothing is selected yet
    // OR if the currently selected background is not ready
    if (
      !selectedBackgroundId ||
      backgrounds.find(b => b.id === selectedBackgroundId)?.status !== "ready"
    ) {
      setSelectedBackgroundId(latestReady.id);
    }
  }, [backgrounds, selectedBackgroundId]);

  const updateProduct = (index: number, updated: Partial<ProductInput>) => {
    setProducts(prev => 
      prev.map((product, i) => 
        i === index ? { ...product, ...updated } : product
      )
    );
  };

  const handleGenerateBackground = () => {
    if (themeText.length < 5) {
      toast({ title: "Theme too short", description: "Please enter at least 5 characters.", variant: "destructive" });
      return;
    }
    generateBackground(themeText);
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadBackground(file);
  };

    const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Keep backend import (if you rely on /api/products later), but also auto-fill artikelNr locally.
    const formData = new FormData();
    formData.append("file", file);
    importProducts(formData, {
      onSuccess: () => {
        toast({ title: "Products Imported", description: "CSV products imported successfully." });
      },
      onError: () => {
        toast({ title: "Import Error", description: "Failed to import CSV file.", variant: "destructive" });
      },
    });

    if (!selectedTemplate) return;

    const readText = (f: File) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
        reader.readAsText(f);
      });

    const parseCsvLine = (line: string, delimiter: string) => {
      const out: string[] = [];
      let cur = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const ch = line[i];

        if (ch === '"') {
          // Handle escaped quotes ("")
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
          continue;
        }

        if (!inQuotes && ch === delimiter) {
          out.push(cur);
          cur = "";
          continue;
        }

        cur += ch;
      }
      out.push(cur);
      return out.map((s) => s.trim());
    };

    (async () => {
      try {
        const raw = await readText(file);
        const lines = raw
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);

        if (lines.length < 2) {
          toast({
            title: "CSV Error",
            description: "CSV must contain a header row and at least 1 data row.",
            variant: "destructive",
          });
          return;
        }

        // Detect delimiter from header line
        const headerLine = lines[0];
        const delimiters = [",", ";", "	"];
        const delimiter =
          delimiters
            .map((d) => ({ d, c: (headerLine.split(d).length - 1) }))
            .sort((a, b) => b.c - a.c)[0]?.d ?? ",";

        const header = parseCsvLine(headerLine, delimiter);
        const artikelIdx = header.findIndex((h) => h === "artikelNr");

        if (artikelIdx === -1) {
          toast({
            title: "CSV Error",
            description: 'Missing required column "artikelNr" in the header row.',
            variant: "destructive",
          });
          return;
        }

        const rows = lines.slice(1).map((line) => parseCsvLine(line, delimiter));
        const artikelNrs = rows
          .map((cols) => (cols[artikelIdx] ?? "").trim())
          .filter(Boolean);

        if (artikelNrs.length === 0) {
          toast({
            title: "CSV Error",
            description: 'No values found under the "artikelNr" column.',
            variant: "destructive",
          });
          return;
        }

        const needed = selectedTemplate.max_products;
        const picked = artikelNrs.slice(0, needed);

        if (picked.length < needed) {
          toast({
            title: "CSV Warning",
            description: `Template expects ${needed} products but CSV has only ${picked.length} usable rows. The remaining slots will stay empty.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Article Numbers Filled",
            description: `Auto-filled ${picked.length} article numbers from CSV.`,
          });
        }

        // Fill artikelNr slots; keep any already selected images in place
        setProducts((prev) =>
          Array.from({ length: needed }, (_, i) => ({
            artikelNr: picked[i] ?? "",
            image: prev[i]?.image ?? null,
          }))
        );

        // Reset export when inputs change
        setExportUrl(null);
      } catch {
        toast({ title: "Import Error", description: "Failed to parse CSV file.", variant: "destructive" });
      } finally {
        // allow re-uploading the same file
        if (e.target) e.target.value = "";
      }
    })();
  };

  const handleCreatePoster = () => {
    if (!selectedTemplate) {
      toast({ title: "Template Error", description: "No template selected.", variant: "destructive" });
      return;
    }

    // Validate background_id exists and background is ready
    if (!selectedBackgroundId) {
      toast({ title: "Select Background", description: "Please select or generate a background.", variant: "destructive" });
      return;
    }
    const background = backgrounds.find(b => b.id === selectedBackgroundId);
    if (!background || background.status !== 'ready') {
      toast({ title: "Background Not Ready", description: "Please wait for background to complete or select a ready one.", variant: "destructive" });
      return;
    }

    // Validate sale_title is non-empty
    if (!saleTitle.trim()) {
      toast({ title: "Missing Title", description: "Please enter a sale title.", variant: "destructive" });
      return;
    }

    // Validate products array length equals max_products
    if (products.length !== selectedTemplate.max_products) {
      toast({ title: "Product Count Mismatch", description: `Template requires exactly ${selectedTemplate.max_products} products.`, variant: "destructive" });
      return;
    }

    // Validate every product entry has artikelNr and imageFile
    for (let i = 0; i < selectedTemplate.max_products; i++) {
      const product = products[i];
      if (!product.artikelNr.trim()) {
        toast({ title: "Missing Article Number", description: `Product ${i + 1} needs an article number.`, variant: "destructive" });
        return;
      }
      if (!product.image) {
        toast({ title: "Missing Product Image", description: `Product ${i + 1} needs an image.`, variant: "destructive" });
        return;
      }
    }

    // Call create-poster mutation with validated data
    createPoster({
      templateKey: selectedTemplate.key,
      maxProducts: selectedTemplate.max_products,
      backgroundId: selectedBackgroundId,
      saleTitle,
      products,
    }, {
      onSuccess: async (poster) => {
        try {
          setIsExporting(true);
          
          const exportResult = await exportPoster(poster.id);
          
          setExportUrl(exportResult.url);
          toast({ 
            title: "Poster Ready", 
            description: "Your poster has been generated successfully." 
          });
        } catch (err: any) {
          toast({ 
            title: "Export Failed", 
            description: "Poster was created but export failed.", 
            variant: "destructive" 
          });
        } finally {
          setIsExporting(false);
        }
      },
      onError: (error: any) => {
        toast({ 
          title: "Creation Failed", 
          description: error.message || "Failed to create poster.", 
          variant: "destructive" 
        });
      }
    });
  };

  const selectedBackground = backgrounds.find(b => b.id === selectedBackgroundId);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Left Sidebar */}
      <div className="w-[280px] bg-white border-r border-border shrink-0">
        <div className="p-4 border-b border-border">
          <h1 className="font-display text-xl font-bold">Poster Generator</h1>
          <p className="text-sm text-muted-foreground">Create AI-powered marketing posters</p>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex min-w-0">
        {/* Center: Preview */}
        <div className="flex-1 relative border-r border-border bg-slate-50 flex items-center justify-center">
          {exportUrl ? (
            // Show final exported poster
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white aspect-[297/420] h-[90%] max-h-full rounded-sm shadow-2xl overflow-hidden"
            >
              <img 
                src={exportUrl}
                alt="Final Poster" 
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => console.error('[preview] Final poster failed to load:', exportUrl, e)}
              />
            </motion.div>
          ) : selectedBackground?.url ? (
            // Show background preview if no poster exported yet
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white aspect-[297/420] h-[90%] max-h-full rounded-sm shadow-2xl overflow-hidden"
            >
              <img 
                src={selectedBackground.url}
                alt="Poster Background" 
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => console.error('[preview] Image failed to load:', selectedBackground.url, e)}
              />
              <div className="relative z-10 w-full h-full p-8 flex flex-col justify-center">
                <h2 className="text-4xl font-display font-bold text-white text-center drop-shadow-lg">
                  {saleTitle || "SALE TITLE"}
                </h2>
              </div>
            </motion.div>
          ) : (
            <div className="text-center">
              <p className="text-slate-400 font-medium">Generate or select a background to preview</p>
            </div>
          )}
        </div>

        {/* Right: Controls */}
        <div className="w-[350px] bg-white overflow-y-auto shrink-0 flex flex-col">
          <div className="p-3 border-b border-border">
            <h2 className="font-display text-lg font-bold">Design Controls</h2>
          </div>
          <div className="flex-1 p-6 space-y-8 overflow-y-auto">
            {/* Background Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Background</Label>
                <Wand2 className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <Label htmlFor="theme" className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Theme</Label>
                <textarea
                  id="theme"
                  className="w-full min-h-[60px] p-3 rounded-lg border border-input text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Describe background style (min 5 chars)..."
                  value={themeText}
                  onChange={(e) => setThemeText(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-gradient-to-r from-teal-400 to-blue-500 text-white border-0 text-sm"
                    onClick={handleGenerateBackground}
                    disabled={isGenerating || themeText.length < 5}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3 h-3 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                  <Button 
                    className="px-3 text-sm"
                    variant="outline"
                    onClick={() => bgFileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    Upload
                  </Button>
                  <input
                    ref={bgFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBackgroundUpload}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bg-select" className="text-xs text-muted-foreground">Select Background</Label>
                <Select 
                  value={selectedBackgroundId || ""} 
                  onValueChange={setSelectedBackgroundId}
                >
                  <SelectTrigger id="bg-select">
                    <SelectValue placeholder="Choose a background..." />
                  </SelectTrigger>
                  <SelectContent>
                    {backgrounds.map((bg) => (
                      <SelectItem key={bg.id} value={bg.id}>
                        {bg.status === 'ready' ? '✓ Ready' : '⟳ Generating'} - {bg.id.substring(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </section>

            {/* Poster Details */}
            <section className="space-y-4">
              <Label className="text-base font-semibold">Poster Details</Label>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs text-muted-foreground">Sale Title</Label>
                  <Input 
                    id="title" 
                    value={saleTitle}
                    onChange={(e) => setSaleTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="template" className="text-xs text-muted-foreground">Template</Label>
                  <Select value={templateKey} onValueChange={(v: any) => setTemplateKey(v)}>
                    <SelectTrigger id="template">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.key} value={template.key}>
                          {template.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Products */}
            <section className="space-y-4">
              <Label className="text-base font-semibold">Products</Label>
              <Button 
                className="w-full"
                size="sm"
                variant="outline"
                onClick={() => csvFileInputRef.current?.click()}
                disabled={isImporting}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-3 h-3 mr-2" />
                    Import CSV
                  </>
                )}
              </Button>
              {/* Step 3: Render inputs dynamically */}
              {products.map((product, index) => (
                <ProductInput
                  key={index}
                  index={index}
                  value={product}
                  onChange={(updated) => updateProduct(index, updated)}
                  toast={toast}
                />
              ))}
            </section>
          </div>

          {/* Bottom Actions */}
          <div className="p-6 border-t border-border space-y-3">
            <Button 
              className="w-full" 
              variant="default"
              onClick={handleCreatePoster}
              disabled={isCreating || isExporting}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Create Poster
                </>
              )}
            </Button>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => {
                if (!exportUrl) {
                  toast({ 
                    title: "No Poster", 
                    description: "Create and export a poster first.", 
                    variant: "destructive" 
                  });
                  return;
                }
                
                const link = document.createElement('a');
                link.href = exportUrl;
                link.download = 'poster.png';
                link.click();
              }}
              disabled={!exportUrl || isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Poster
            </Button>
            <input
              ref={csvFileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCSVUpload}
            />
          </div>
        </div>
      </main>
    </div>
  );
}