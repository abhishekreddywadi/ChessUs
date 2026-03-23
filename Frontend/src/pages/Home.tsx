import { Link } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";

export const Home = () => {

  return (
    <>
      <p>Chess Image </p>
     
      <Link to={"game"}>
        <button >Join Room</button>
      </Link>
    </>
  );
};
