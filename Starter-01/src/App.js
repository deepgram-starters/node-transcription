import { Router, Route, Switch } from "react-router-dom";

import NavBar from "./components/NavBar";
import Footer from "./components/Footer";
import Home from "./views/Home";
import history from "./utils/history";

const App = () => {
  return (
    <Router history={history}>
      <main className="flex flex-col h-full min-h-screen bg-slate-50">
        <NavBar />
        <Switch>
          <Route path="/" exact component={Home} />
        </Switch>
        <Footer />
      </main>
    </Router>
  );
};

export default App;
