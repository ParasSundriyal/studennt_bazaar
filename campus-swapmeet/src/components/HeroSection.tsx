import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-secondary">
      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Buy & Sell with
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  {" "}Fellow Students
                </span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-lg">
                Connect with students from your college and nearby campuses. 
                Find great deals on textbooks, electronics, and more!
              </p>
            </div>

            {/* Search Bar */}
            <div className="flex gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="What are you looking for?"
                  className="pl-10 h-12 bg-background border-border"
                />
              </div>
              <Button variant="hero" size="lg">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-4">
              <div>
                <div className="text-2xl font-bold text-primary">5,000+</div>
                <div className="text-sm text-muted-foreground">Active Students</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">Colleges</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">10,000+</div>
                <div className="text-sm text-muted-foreground">Items Sold</div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative z-10">
              <img
                src={heroImage}
                alt="Students trading items"
                className="w-full h-auto rounded-2xl shadow-medium"
              />
            </div>
            {/* Gradient overlay for depth */}
            <div className="absolute -top-4 -right-4 -bottom-4 -left-4 bg-gradient-accent opacity-20 rounded-3xl blur-xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;