import { useState, useEffect } from "react";
import { Quote } from "lucide-react";

const quotes = [
  {
    text: "If you're not failing every now and again, it's a sign you're not doing anything very innovative.",
    author: "Woody Allen"
  },
  {
    text: "The creative process is a process of surrender, not control.",
    author: "Julia Cameron"
  },
  {
    text: "Creativity is allowing yourself to make mistakes. Art is knowing which ones to keep.",
    author: "Scott Adams"
  },
  {
    text: "Don't think about making art, just get it done. Let everyone else decide if it's good or bad, whether they love it or hate it. While they are deciding, make even more art.",
    author: "Andy Warhol"
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs"
  },
  {
    text: "Photography is the story I fail to put into words.",
    author: "Destin Sparks"
  },
  {
    text: "Your photography is a record of your living, for anyone who really sees.",
    author: "Paul Strand"
  },
  {
    text: "The camera is an instrument that teaches people how to see without a camera.",
    author: "Dorothea Lange"
  }
];

export const InspirationalQuote = () => {
  const [currentQuote, setCurrentQuote] = useState(quotes[0]);

  useEffect(() => {
    // Pick a random quote on mount
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setCurrentQuote(randomQuote);
  }, []);

  return (
    <div className="max-w-3xl mx-auto mt-6 px-4">
      <div className="relative">
        <div className="absolute -left-2 -top-2 text-vault-gold/20">
          <Quote className="h-8 w-8 md:h-12 md:w-12" />
        </div>
        <blockquote className="pl-8 md:pl-12">
          <p className="text-sm md:text-base lg:text-lg text-muted-foreground/90 italic font-light leading-relaxed mb-3">
            "{currentQuote.text}"
          </p>
          <footer className="text-xs md:text-sm text-vault-gold font-medium">
            — {currentQuote.author}
          </footer>
        </blockquote>
      </div>
    </div>
  );
};
