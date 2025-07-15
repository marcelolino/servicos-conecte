import { Card, CardContent } from "@/components/ui/card";
import type { ServiceCategory } from "@shared/schema";

interface ServiceCardProps {
  category: ServiceCategory;
  onClick: () => void;
}

const getIconForCategory = (name: string) => {
  const icons: Record<string, string> = {
    "Encanador": "🔧",
    "Diarista": "🧹",
    "Motorista": "🚗",
    "Soldador": "🔥",
    "Cuidador": "❤️",
    "Culinária": "🍽️",
    "Montador": "🔨",
    "Faxineira": "✨",
    "Entregador": "📦",
    "Eletricista": "⚡",
    "Jardineiro": "🌱",
    "Pintor": "🎨",
  };
  
  return icons[name] || "🔧";
};

const getColorForCategory = (name: string) => {
  const colors: Record<string, string> = {
    "Encanador": "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
    "Diarista": "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
    "Motorista": "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400",
    "Soldador": "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400",
    "Cuidador": "bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-400",
    "Culinária": "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400",
    "Montador": "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400",
    "Faxineira": "bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-400",
    "Entregador": "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400",
    "Eletricista": "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400",
    "Jardineiro": "bg-lime-100 text-lime-600 dark:bg-lime-900 dark:text-lime-400",
    "Pintor": "bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-400",
  };
  
  return colors[name] || "bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400";
};

export default function ServiceCard({ category, onClick }: ServiceCardProps) {
  return (
    <Card className="service-card" onClick={onClick}>
      <CardContent className="p-6">
        <div className={`service-icon ${getColorForCategory(category.name)} group-hover:scale-110 transition-transform`}>
          <span className="text-2xl">{getIconForCategory(category.name)}</span>
        </div>
        <h4 className="font-semibold text-foreground mb-2">{category.name}</h4>
        <p className="text-sm text-muted-foreground">{category.description}</p>
      </CardContent>
    </Card>
  );
}
