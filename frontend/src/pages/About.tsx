import { Layers, Code2, Database, Paintbrush, Package, Container, Route, Zap } from 'lucide-react'

export default function About() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">About</h1>
      <div className="prose prose-gray">
        <p className="text-lg mb-4">
          This is a Tanda Hackathon learning project built with modern web technologies.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Tech Stack</h2>
        <ul className="space-y-3 mb-6">
          <li className="flex items-center gap-3">
            <Code2 className="size-5 text-blue-600" />
            <span><strong>Frontend:</strong> React 19 + TypeScript + Vite</span>
          </li>
          <li className="flex items-center gap-3">
            <Layers className="size-5 text-green-600" />
            <span><strong>Backend:</strong> Python FastAPI</span>
          </li>
          <li className="flex items-center gap-3">
            <Database className="size-5 text-purple-600" />
            <span><strong>Database:</strong> PostgreSQL 15</span>
          </li>
          <li className="flex items-center gap-3">
            <Paintbrush className="size-5 text-cyan-600" />
            <span><strong>Styling:</strong> Tailwind CSS v4</span>
          </li>
          <li className="flex items-center gap-3">
            <Package className="size-5 text-orange-600" />
            <span><strong>Components:</strong> shadcn/ui</span>
          </li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Features</h2>
        <ul className="space-y-3">
          <li className="flex items-center gap-3">
            <Container className="size-5 text-blue-500" />
            <span>Full-stack architecture with Docker</span>
          </li>
          <li className="flex items-center gap-3">
            <Route className="size-5 text-green-500" />
            <span>React Router for navigation</span>
          </li>
          <li className="flex items-center gap-3">
            <Database className="size-5 text-purple-500" />
            <span>Async database connection pooling</span>
          </li>
          <li className="flex items-center gap-3">
            <Zap className="size-5 text-yellow-500" />
            <span>Hot module replacement (HMR)</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
