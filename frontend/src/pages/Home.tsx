import { useState, useEffect } from 'react'
import reactLogo from '../assets/react.svg'
import viteLogo from '/vite.svg'

export default function Home() {
  const [count, setCount] = useState(0)
  const [backendConnected, setBackendConnected] = useState(false)

  useEffect(() => {
    const fetchTables = async () => {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/`)
      setBackendConnected(response.ok)
    }
    fetchTables()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex gap-8 mb-8">
        <a href="https://vite.dev" target="_blank" rel="noreferrer">
          <img src={viteLogo} className="w-24 h-24 hover:drop-shadow-[0_0_2em_#646cffaa]" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="w-24 h-24 hover:drop-shadow-[0_0_2em_#61dafbaa] animate-spin-slow" alt="React logo" />
        </a>
      </div>

      <h1 className="text-4xl font-bold mb-4">Vite + React</h1>

      <div className="mb-6">
        {backendConnected ? (
          <p className="text-green-600 font-semibold">✓ Backend connected</p>
        ) : (
          <p className="text-red-600 font-semibold">✗ Backend not connected</p>
        )}
      </div>

      <div className="card">
        <button
          onClick={() => setCount((count) => count + 1)}
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          count is {count}
        </button>
        <p className="mt-4 text-gray-600">
          Edit <code className="bg-gray-100 px-2 py-1 rounded">src/pages/Home.tsx</code> and save to test HMR
        </p>
      </div>

      <p className="mt-8 text-sm text-gray-500">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  )
}
