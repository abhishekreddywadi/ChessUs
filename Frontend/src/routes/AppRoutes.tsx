import { Game } from "../pages/game/Game";
import { Home } from "../pages/Home";


const AppRoutes = [
  {
    path: "/",
    element: <Home />
    
   },
  {
    path: "/game",
    element: <Game />
    
   }
];

export default AppRoutes;