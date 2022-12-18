
import { useEffect, createContext, useState, useMemo } from "react";
import Dashboard from "./components/dashboard"
import './App.css';

export const UserContext = createContext(null);

function App() {
  const [user, setUser] = useState({ key: "", name: "", rol: "" });
  const providerValue = useMemo(() => ({ user, setUser }), [user, setUser])

  useEffect(() => {
    const currentUser = localStorage.getItem("user");
    if (currentUser) {
      setUser(JSON.parse(currentUser))
    }
  }, [])
  return (
    <div className="App">
      <UserContext.Provider value={providerValue}>
        <Dashboard />
      </UserContext.Provider>
    </div>
  );
}

export default App;
