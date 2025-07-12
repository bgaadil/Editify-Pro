// Full-featured Image Editor with All Tools, Polished UI, Theme Toggle, and Background Remover
import React, { useRef, useState, useEffect } from "react";
import perspective from "perspective-transform";
import { motion } from "framer-motion";

function App() {
  const canvasRef = useRef(null);
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;

  const [imageSrc, setImageSrc] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [drawOffset, setDrawOffset] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: "", height: "" });
  const [showResize, setShowResize] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [cropPoints, setCropPoints] = useState([]);
  const [draggingPoint, setDraggingPoint] = useState(null);
  const [textInputs, setTextInputs] = useState([]);
  const [currentText, setCurrentText] = useState("");
  const [isAddingText, setIsAddingText] = useState(false);
  const [history, setHistory] = useState([]);
  const [redoHistory, setRedoHistory] = useState([]);
  const [darkMode, setDarkMode] = useState(false);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    const data = canvas.toDataURL();
    setHistory((prev) => [...prev, data]);
    setRedoHistory([]);
  };

  const removeBackground = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const threshold = 30;
    const r = data[0], g = data[1], b = data[2];

    for (let i = 0; i < data.length; i += 4) {
      const dr = Math.abs(data[i] - r);
      const dg = Math.abs(data[i + 1] - g);
      const db = Math.abs(data[i + 2] - b);
      if (dr < threshold && dg < threshold && db < threshold) {
        data[i + 3] = 0;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    saveToHistory();
  };

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const widthRatio = CANVAS_WIDTH / img.width;
        const heightRatio = CANVAS_HEIGHT / img.height;
        const scale = Math.min(widthRatio, heightRatio);

        const newWidth = img.width * scale;
        const newHeight = img.height * scale;
        const offsetX = (CANVAS_WIDTH - newWidth) / 2;
        const offsetY = (CANVAS_HEIGHT - newHeight) / 2;

        ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);

        setImageSrc(event.target.result);
        setImageSize({ width: newWidth, height: newHeight });
        setDrawOffset({ x: offsetX, y: offsetY });
        setDimensions({ width: newWidth, height: newHeight });
        saveToHistory();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const applyGrayscale = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const avg = (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2]) / 3;
      imageData.data[i] = avg;
      imageData.data[i + 1] = avg;
      imageData.data[i + 2] = avg;
    }
    ctx.putImageData(imageData, 0, 0);
    saveToHistory();
  };

  const undo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = lastState;
    setRedoHistory((prev) => [...prev, canvas.toDataURL()]);
    setHistory((prev) => prev.slice(0, -1));
  };

  const redo = () => {
    if (redoHistory.length === 0) return;
    const nextState = redoHistory[redoHistory.length - 1];
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = nextState;
    setHistory((prev) => [...prev, canvas.toDataURL()]);
    setRedoHistory((prev) => prev.slice(0, -1));
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = "edited-image.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="flex bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-900 dark:to-gray-800 min-h-screen">
        <aside className="w-80 p-5 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-r overflow-y-auto">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">🖌️ Editify Pro</h1>
          <input type="file" accept="image/*" onChange={handleUpload} className="mb-3" />
          <button onClick={() => setShowResize(!showResize)} className="w-full bg-blue-500 text-white py-2 px-4 mb-2 rounded">Resize</button>
          {showResize && (
            <div className="space-y-2 mb-4">
              <input type="number" placeholder="Width" value={dimensions.width} onChange={(e) => setDimensions({ ...dimensions, width: +e.target.value })} className="w-full p-2 border rounded" />
              <input type="number" placeholder="Height" value={dimensions.height} onChange={(e) => setDimensions({ ...dimensions, height: +e.target.value })} className="w-full p-2 border rounded" />
            </div>
          )}
          <input type="text" placeholder="Enter text" value={currentText} onChange={(e) => setCurrentText(e.target.value)} className="w-full p-2 mb-2 border rounded" />
          <button onClick={() => setIsAddingText(true)} className="w-full py-2 px-4 bg-yellow-600 text-white rounded mb-2">Add Text</button>
          <button onClick={() => setIsCropping(!isCropping)} className="w-full py-2 px-4 bg-gray-600 text-white rounded mb-2">{isCropping ? "Exit Crop Mode" : "Start Crop"}</button>
          <button onClick={applyGrayscale} className="w-full py-2 px-4 bg-indigo-500 text-white rounded mb-2">Grayscale</button>
          <button onClick={removeBackground} className="w-full py-2 px-4 bg-pink-600 text-white rounded mb-2">Remove Background</button>
          <button onClick={undo} className="w-full py-2 px-4 bg-gray-500 text-white rounded mb-2">Undo</button>
          <button onClick={redo} className="w-full py-2 px-4 bg-blue-600 text-white rounded mb-2">Redo</button>
          <button onClick={handleDownload} className="w-full py-2 px-4 bg-purple-600 text-white rounded mb-2">Download</button>
          <button onClick={() => setDarkMode(!darkMode)} className="w-full py-2 px-4 bg-black text-white rounded">Toggle Theme</button>
        </aside>

        <main className="flex-1 flex items-center justify-center p-4">
          <motion.canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className="rounded-lg border-4 border-white dark:border-gray-700 shadow-xl bg-white dark:bg-gray-900"
          />
        </main>
      </div>
    </div>
  );
}

export default App;
