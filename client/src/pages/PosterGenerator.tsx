import { useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { PosterPreview } from "@/components/PosterPreview";
import { usePoster, useUpdatePoster, useGenerateBackground, useCreatePoster } from "@/hooks/use-posters";
import { useProducts } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Download, Save, Loader2, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { InsertPoster } from "@shared/routes";

// Initial empty state
const emptyPoster: InsertPoster = {
  userId: 1, // Mocked for now
  templateKey: "2_products",
  saleTitle: "Summer Sale",
  themeText: "Summer beach vibes with palm trees and sun",
  status: "draft",
  productIds: [],
  disclaimer: "Valid until 31st August 2024.",
  dates: "Aug 1 - Aug 31",
  storeLogoUrl: "",
  backgroundImageUrl: "",
};

export default function PosterGenerator() {
  // In a real app, we might get ID from URL, but here we'll create a session poster or load one
  const [posterId, setPosterId] = useState<number | null>(null);
  const { data: posterData, isLoading: isPosterLoading } = usePoster(posterId || 0);
  const { data: products = [] } = useProducts();
  const { mutate: createPoster } = useCreatePoster();
  const { mutate: updatePoster } = useUpdatePoster();
  const { mutate: generateBackground, isPending: isGenerating } = useGenerateBackground();
  const { toast } = useToast();

  const [localState, setLocalState] = useState<InsertPoster>(emptyPoster);

  // Initialize poster if none exists
  useEffect(() => {
    if (!posterId) {
      createPoster(emptyPoster, {
        onSuccess: (data) => {
          setPosterId(data.id);
          setLocalState(data);
        }
      });
    }
  }, []);

  // Sync server state to local state when polling updates it
  useEffect(() => {
    if (posterData) {
      setLocalState(posterData);
    }
  }, [posterData]);

  const handleUpdate = (field: keyof InsertPoster, value: any) => {
    setLocalState(prev => ({ ...prev, [field]: value }));
  };

  const saveChanges = () => {
    if (!posterId) return;
    updatePoster({ id: posterId, ...localState });
  };

  const handleGenerate = () => {
    if (!posterId) return;
    saveChanges(); // Save current text first
    generateBackground({ id: posterId, themeText: localState.themeText });
  };

  const toggleProduct = (productId: number) => {
    const currentIds = localState.productIds || [];
    const newIds = currentIds.includes(productId)
      ? currentIds.filter(id => id !== productId)
      : [...currentIds, productId].slice(0, 3); // Max 3 products
    handleUpdate("productIds", newIds);
  };

  if (!posterId || isPosterLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      
      {/* Main Content Area */}
      <main className="flex-1 flex min-w-0">
        {/* Center: Preview */}
        <div className="flex-1 relative border-r border-border">
          <PosterPreview poster={localState as any} products={products} />
        </div>

        {/* Right: Controls */}
        <div className="w-[350px] bg-white overflow-y-auto shrink-0 flex flex-col">
          <div className="p-6 border-b border-border">
            <h2 className="font-display text-lg font-bold mb-1">Design Controls</h2>
            <p className="text-sm text-muted-foreground">Customize your poster appearance</p>
          </div>

          <div className="flex-1 p-6 space-y-8">
            {/* Theme Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">AI Theme Generation</Label>
                <Wand2 className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <Label htmlFor="theme" className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Prompt</Label>
                <textarea
                  id="theme"
                  className="w-full min-h-[80px] p-3 rounded-lg border border-input text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="Describe the background style..."
                  value={localState.themeText}
                  onChange={(e) => handleUpdate("themeText", e.target.value)}
                />
                <Button 
                  className="w-full bg-gradient-to-r from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white border-0 shadow-lg shadow-blue-500/20"
                  onClick={handleGenerate}
                  disabled={isGenerating || localState.status === 'generating'}
                >
                  {isGenerating || localState.status === 'generating' ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate Background
                    </>
                  )}
                </Button>
              </div>
            </section>

            {/* Text Details */}
            <section className="space-y-4">
              <Label className="text-base font-semibold">Text Content</Label>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs text-muted-foreground">Sale Title</Label>
                  <Input 
                    id="title" 
                    value={localState.saleTitle}
                    onChange={(e) => handleUpdate("saleTitle", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dates" className="text-xs text-muted-foreground">Dates</Label>
                  <Input 
                    id="dates" 
                    value={localState.dates || ""}
                    onChange={(e) => handleUpdate("dates", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="disclaimer" className="text-xs text-muted-foreground">Disclaimer</Label>
                  <Input 
                    id="disclaimer" 
                    value={localState.disclaimer || ""}
                    onChange={(e) => handleUpdate("disclaimer", e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Products Selection */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Select Products</Label>
                <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-600 font-medium">
                  {localState.productIds.length}/3
                </span>
              </div>
              
              <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {products.map((product: any) => {
                  const isSelected = localState.productIds.includes(product.id);
                  return (
                    <div 
                      key={product.id}
                      onClick={() => toggleProduct(product.id)}
                      className={`
                        flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all duration-200
                        ${isSelected 
                          ? "bg-primary/5 border-primary shadow-sm" 
                          : "bg-white border-transparent hover:bg-slate-50 border-slate-100"}
                      `}
                    >
                      <div className="w-10 h-10 bg-slate-200 rounded-md overflow-hidden shrink-0">
                        <img 
                          src={product.imagePath || `https://placehold.co/100x100?text=${product.name.charAt(0)}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">${product.price}</p>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-primary" />}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-border bg-slate-50 space-y-3">
            <Button 
              className="w-full" 
              variant="default"
              onClick={saveChanges}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => toast({ title: "Export Started", description: "Your download will begin shortly." })}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Poster
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
