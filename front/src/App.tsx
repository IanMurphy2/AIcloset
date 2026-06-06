import { Button } from "@/components/ui/button";

function App() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8">
      <h1 className="text-4xl font-bold tracking-tight text-primary">
        AI Closet
      </h1>
      <p className="text-lg text-muted-foreground">
        Bootstrap del frontend funcionando: Vite + React + TS + Tailwind +
        shadcn/ui.
      </p>
      <Button onClick={() => alert("shadcn/ui Button OK")}>
        Botón de ejemplo
      </Button>
    </main>
  );
}

export default App;
