import { motion, AnimatePresence } from "framer-motion";
import { Product, Poster } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface PosterPreviewProps {
  poster: Poster;
  products: Product[];
}

export function PosterPreview({ poster, products }: PosterPreviewProps) {
  const selectedProducts = products.filter(p => poster.productIds.includes(p.id));

  return (
    <div className="relative w-full h-full flex items-center justify-center p-8 bg-[#F0F4F8]">
      {/* Canvas Area */}
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white aspect-[9/16] h-[90%] rounded-sm shadow-2xl overflow-hidden poster-shadow"
      >
        {/* Background Image */}
        {poster.backgroundImageUrl ? (
          <img 
            src={poster.backgroundImageUrl} 
            alt="Poster Background" 
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <p className="text-slate-400 font-medium">No background generated</p>
          </div>
        )}

        {/* Loading Overlay */}
        <AnimatePresence>
          {poster.status === 'generating' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center z-50 text-white"
            >
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-teal-400" />
              <p className="font-medium text-lg">Designing your poster...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Layer */}
        <div className="relative z-10 w-full h-full p-8 flex flex-col">
          {/* Header Area */}
          <div className="text-center mb-8 bg-black/30 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-lg">
            <h2 className="text-4xl font-display font-bold text-white uppercase tracking-wider drop-shadow-md">
              {poster.saleTitle || "SALE TITLE"}
            </h2>
            {poster.dates && (
              <p className="text-teal-300 font-medium mt-1 text-lg drop-shadow-sm">{poster.dates}</p>
            )}
          </div>

          {/* Products Grid */}
          <div className="flex-1 grid grid-cols-1 gap-6 content-center">
            {selectedProducts.map((product, idx) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-4 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/50"
              >
                <div className="w-24 h-24 bg-slate-200 rounded-lg overflow-hidden shrink-0">
                  {/* Placeholder or actual image */}
                  <img 
                    src={product.imagePath || `https://placehold.co/200x200?text=${product.name}`} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 text-lg truncate">{product.name}</h3>
                  <p className="text-slate-500 text-sm mb-1">Premium Quality</p>                  <div className="inline-block bg-primary text-white px-3 py-1 rounded-full font-bold shadow-md shadow-primary/20">
                    Special offer
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-auto text-center pt-8">
            <p className="text-white/90 text-sm font-medium drop-shadow-md max-w-[80%] mx-auto">
              {poster.disclaimer || "Terms and conditions apply. Offer valid while stocks last."}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
