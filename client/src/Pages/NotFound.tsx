import { LuFileQuestion, LuHouse } from "react-icons/lu";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl opacity-50 transform scale-150" />

          <div className="relative space-y-2">
            <LuFileQuestion className="w-24 h-24 mx-auto text-muted-foreground/30" />
            <h1 className="text-8xl font-bold text-primary tracking-tighter">
              404
            </h1>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-balance">
            Página no encontrada
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed text-balance">
            Lo sentimos, no pudimos encontrar la ruta que buscas. Es posible que
            la dirección sea incorrecta o que la página haya sido eliminada.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Link
            to="/galery"
            className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <LuHouse className="w-4 h-4" />
            Ir al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
