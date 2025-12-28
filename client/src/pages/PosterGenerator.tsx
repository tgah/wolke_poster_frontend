import { useState, useRef } from "react";
import { useCreatePoster } from "@/hooks/use-posters";
import { useProducts, useImportProducts } from "@/hooks/use-products";
import { useBackgrounds } from "@/hooks/use-backgrounds";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Download, Loader2, Check, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function PosterGenerator() {
  const { backgrounds, generateBackground, uploadBackground, isGenerating, isUploading } = useBackgrounds();
  const { data: products = [] } = useProducts();
  const { mutate: createPoster, isPending: isCreating } = useCreatePoster();
  const { mutate: importProducts, isPending: isImporting } = useImportProducts();
  const { toast } = useToast();

  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const productImageRefs = useRef<HTMLInputElement[]>([null, null, null]);

  const [templateKey, setTemplateKey] = useState<"two_product" | "three_product">("two_product");
  const [selectedBackgroundId, setSelectedBackgroundId] = useState<string | null>(null);
  const [saleTitle, setSaleTitle] = useState("Summer Sale");
  const [themeText, setThemeText] = useState("Summer beach vibes");
  const [produktImages, setProduktImages] = useState<(File | null)[]>([null, null, null]);
  const [prices, setPrices] = useState<(number | "")[]>([0, 0, 0]);
  const [artikelNrs, setArtikelNrs] = useState<string[]>(["", "", ""]);

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

  const handleProductImageUpload = (index: number) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setProduktImages(prev => {
        const newImages = [...prev];
        newImages[index] = file;
        return newImages;
      });
    };
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    importProducts(formData, {
      onSuccess: () => {
        toast({ title: "Products Imported", description: "CSV products imported successfully." });
      },
      onError: () => {
        toast({ title: "Import Error", description: "Failed to import CSV file.", variant: "destructive" });
      }
    });
  };

  const handleCreatePoster = () => {
    if (!selectedBackgroundId) {
      toast({ title: "Select Background", description: "Please select or generate a background.", variant: "destructive" });
      return;
    }
    if (!saleTitle.trim()) {
      toast({ title: "Missing Title", description: "Please enter a sale title.", variant: "destructive" });
      return;
    }

    const productCount = templateKey === "two_product" ? 2 : 3;
    const images: File[] = [];
    const validPrices: number[] = [];
    const validNrs: string[] = [];

    for (let i = 0; i < productCount; i++) {
      if (!produktImages[i]) {
        toast({ title: "Missing Product Image", description: `Product ${i + 1} needs an image.`, variant: "destructive" });
        return;
      }
      images.push(produktImages[i]!);
      validPrices.push(Number(prices[i]) || 0);
      validNrs.push(artikelNrs[i] || "");
    }

    createPoster({
      backgroundId: selectedBackgroundId,
      templateKey,
      saleTitle,
      images,
      prices: validPrices,
      artikelNrs: validNrs,
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
          {selectedBackground?.url ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative bg-white aspect-[9/16] h-[90%] rounded-sm shadow-2xl overflow-hidden"
            >
              <img 
                src={selectedBackground.url} 
                alt="Poster Background" 
                className="absolute inset-0 w-full h-full object-cover"
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
          <div className="p-6 border-b border-border">
            <h2 className="font-display text-lg font-bold mb-1">Design Controls</h2>
            <p className="text-sm text-muted-foreground">Create your poster</p>
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
                <Select value={selectedBackgroundId || ""} onValueChange={setSelectedBackgroundId}>
                  <SelectTrigger id="bg-select">
                    <SelectValue placeholder="Choose a background..." />
                  </SelectTrigger>
                  <SelectContent>
                    {backgrounds.map((bg) => (
                      <SelectItem key={bg.id} value={bg.id}>
                        {bg.status === 'completed' ? '✓ Ready' : '⟳ Generating'} - {bg.id.substring(0, 8)}
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
                      <SelectItem value="two_product">2 Products</SelectItem>
                      <SelectItem value="three_product">3 Products</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>

            {/* Products */}
            <section className="space-y-4">
              <Label className="text-base font-semibold">Products</Label>
              {[0, 1, ...(templateKey === "three_product" ? [2] : [])].map((idx) => (
                <div key={idx} className="space-y-3 p-3 bg-slate-50 rounded-lg">
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Article #{idx + 1}</Label>
                      <Input 
                        value={artikelNrs[idx] || ""}
                        onChange={(e) => {
                          const newNrs = [...artikelNrs];
                          newNrs[idx] = e.target.value;
                          setArtikelNrs(newNrs);
                        }}
                        placeholder="Article number"
                        className="text-xs"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Price</Label>
                      <Input 
                        type="number"
                        value={prices[idx]}
                        onChange={(e) => {
                          const newPrices = [...prices];
                          newPrices[idx] = e.target.value ? Number(e.target.value) : "";
                          setPrices(newPrices);
                        }}
                        placeholder="0.00"
                        className="text-xs"
                      />
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => productImageRefs.current[idx]?.click()}
                  >
                    {produktImages[idx] ? "✓ Image" : "Upload Image"}
                  </Button>
                  <input
                    ref={(el) => { productImageRefs.current[idx] = el }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProductImageUpload(idx)}
                  />
                </div>
              ))}
            </section>
          </div>

          {/* Bottom Actions */}
          <div className="p-6 border-t border-border space-y-3">
            <Button 
              className="w-full" 
              variant="default"
              onClick={handleCreatePoster}
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
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
              onClick={() => csvFileInputRef.current?.click()}
              disabled={isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Products CSV
                </>
              )}
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