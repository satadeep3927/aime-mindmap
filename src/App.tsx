import { MindMap } from "./components/mind-map";

declare global {
  interface Window {
    __INITIAL_MINDMAP_DATA__: any;
  }
}

function App() {
  const data = window.__INITIAL_MINDMAP_DATA__
  return (
    <>
      <MindMap
        data={data}
      />
    </>
  );
}

export default App;
