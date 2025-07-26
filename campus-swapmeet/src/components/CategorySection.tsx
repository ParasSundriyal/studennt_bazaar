import { Book, Smartphone, Gamepad2, Shirt, Home, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const categories = [
  { name: "Books", icon: Book, color: "bg-blue-500" },
  { name: "Electronics", icon: Smartphone, color: "bg-purple-500" },
  { name: "Gaming", icon: Gamepad2, color: "bg-green-500" },
  { name: "Fashion", icon: Shirt, color: "bg-pink-500" },
  { name: "Home & Living", icon: Home, color: "bg-orange-500" },
  { name: "More", icon: MoreHorizontal, color: "bg-gray-500" },
];

interface CategorySectionProps {
  selectedCategory?: string;
  onCategorySelect?: (category: string) => void;
}

const CategorySection = ({ selectedCategory, onCategorySelect }: CategorySectionProps) => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold">Browse by Category</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Find exactly what you need from our popular categories
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => {
            const IconComponent = category.icon;
            const isSelected = selectedCategory === category.name;
            return (
              <Button
                key={category.name}
                variant={isSelected ? "default" : "outline"}
                className={`h-24 flex-col space-y-2 hover:shadow-soft hover:scale-105 transform transition-all duration-300 ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => onCategorySelect?.(category.name)}
              >
                <div className={`w-8 h-8 rounded-lg ${category.color} flex items-center justify-center`}>
                  <IconComponent className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium">{category.name}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategorySection;