export default function About() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">About</h1>
      <div className="prose prose-gray">
        <p className="text-lg mb-4">
          This is a Tanda Hackathon learning project built with modern web technologies.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Tech Stack</h2>
        <ul className="list-disc list-inside space-y-2 mb-6">
          <li><strong>Frontend:</strong> React 19 + TypeScript + Vite</li>
          <li><strong>Backend:</strong> Python FastAPI</li>
          <li><strong>Database:</strong> PostgreSQL 15</li>
          <li><strong>Styling:</strong> Tailwind CSS v4</li>
          <li><strong>Components:</strong> shadcn/ui</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">Features</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>Full-stack architecture with Docker</li>
          <li>React Router for navigation</li>
          <li>Async database connection pooling</li>
          <li>Hot module replacement (HMR)</li>
        </ul>
      </div>
    </div>
  )
}
