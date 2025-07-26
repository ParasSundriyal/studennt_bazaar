import { useState } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategorySection from "@/components/CategorySection";
import FeaturedProducts from "@/components/FeaturedProducts";
import Footer from "@/components/Footer";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(selectedCategory === category ? '' : category);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <CategorySection 
        selectedCategory={selectedCategory} 
        onCategorySelect={handleCategorySelect} 
      />
      <FeaturedProducts selectedCategory={selectedCategory} />
      <Footer />
    </div>
  );
};

export default Index;
