import { Providers } from "./providers";
import { CocktailExplorer } from "@/components/cocktail-explorer";

export default function Home() {
  return (
    <Providers>
      <CocktailExplorer />
    </Providers>
  );
}
