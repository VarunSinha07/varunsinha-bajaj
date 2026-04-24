"use client";

import { useState } from "react";

interface Summary {
  total_trees: number;
  total_cycles: number;
  largest_tree_root: string;
}

export interface TreeNode {
  [key: string]: TreeNode;
}

interface HierarchyNode {
  root: string;
  tree: TreeNode;
  depth?: number;
  has_cycle?: true;
}

interface ApiResponse {
  user_id: string;
  email_id: string;
  college_roll_number: string;
  hierarchies: HierarchyNode[];
  invalid_entries: string[];
  duplicate_edges: string[];
  summary: Summary;
}

const RenderTree = ({ tree }: { tree: TreeNode }) => {
  if (!tree || Object.keys(tree).length === 0) return null;

  return (
    <ul className="ml-4 border-l border-gray-300 pl-4 mt-2 space-y-1">
      {Object.entries(tree).map(([node, children]) => (
        <li key={node} className="text-gray-800 font-medium">
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-sm">{node}</span>
          </div>
          <RenderTree tree={children} />
        </li>
      ))}
    </ul>
  );
};

export default function Home() {
  const [inputVal, setInputVal] = useState(`[
  "A->B", "A->C", "B->D", "C->E", "E->F",
  "X->Y", "Y->Z", "Z->X",
  "P->Q", "Q->R",
  "G->H", "G->H", "G->I",
  "hello", "1->2", "A->"
]`);
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);

    let parsedData;
    try {
      parsedData = JSON.parse(inputVal);
      if (!Array.isArray(parsedData)) throw new Error("Input must be a JSON array of strings.");
    } catch {
      setError('Invalid JSON format. Please ensure you matched the structure ["A->B", "X->Y"].');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/bfhl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: parsedData }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reach the API.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 font-sans text-black">
      <main className="max-w-5xl mx-auto space-y-8">
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Node Hierarchy Analyzer</h1>
          <p className="text-gray-500">SRM Full Stack Engineering Challenge</p>
        </header>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
             <div>
              <label htmlFor="nodes" className="block text-sm font-medium text-gray-700 mb-2">Input Array of Nodes (JSON format)</label>
              <textarea
                id="nodes"
                className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow outline-none resize-y"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder='["A->B", "C->D"]'
                spellCheck={false}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3 rounded-lg font-semibold text-white transition-all shadow-md active:scale-95 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : "Analyze Nodes"}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <strong className="font-bold">Error: </strong> {error}
              </div>
            )}
          </form>
        </section>

        {response && (
          <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 border rounded-lg">
                <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">User ID</span>
                <p className="text-gray-900 font-medium truncate">{response.user_id}</p>
              </div>
              <div className="bg-gray-50 p-4 border rounded-lg">
                <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Email</span>
                <p className="text-gray-900 font-medium truncate">{response.email_id}</p>
              </div>
              <div className="bg-gray-50 p-4 border rounded-lg">
                <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Roll Number</span>
                <p className="text-gray-900 font-medium truncate">{response.college_roll_number}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Summary Metrics</h3>
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="min-w-full text-sm">
                      <tbody className="divide-y divide-gray-200">
                        <tr className="bg-white">
                          <td className="px-4 py-3 font-medium text-gray-600">Total Valid Trees</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">{response.summary.total_trees}</td>
                        </tr>
                        <tr className="bg-white">
                          <td className="px-4 py-3 font-medium text-gray-600">Total Cycles Detected</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">{response.summary.total_cycles}</td>
                        </tr>
                        <tr className="bg-white">
                          <td className="px-4 py-3 font-medium text-gray-600">Largest Tree Root</td>
                          <td className="px-4 py-3 text-right font-bold text-gray-900">{response.summary.largest_tree_root || "N/A"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-800 mb-2">Invalid Entries</h3>
                  {response.invalid_entries.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                       {response.invalid_entries.map((entry, i) => (
                         <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                           {entry === "" ? "<empty string>" : entry}
                         </span>
                       ))}
                    </div>
                  ) : <span className="text-sm text-gray-500">None detected.</span>}
                </div>

                <div>
                   <h3 className="text-sm font-bold text-gray-800 mb-2">Duplicate Edges</h3>
                  {response.duplicate_edges.length > 0 ? (
                     <div className="flex flex-wrap gap-2">
                       {response.duplicate_edges.map((edge, i) => (
                         <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                           {edge}
                         </span>
                       ))}
                    </div>
                  ) : <span className="text-sm text-gray-500">None detected.</span>}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center justify-between">
                  <span>Hierarchies</span>
                  <span className="text-sm font-normal bg-gray-100 px-2 py-1 rounded text-gray-600">
                    {response.hierarchies.length} found
                  </span>
                </h3>
                <div className="bg-gray-50 p-4 border border-gray-200 rounded-lg min-h-[16rem] overflow-x-auto shadow-inner">
                  {response.hierarchies.length === 0 ? (
                    <p className="text-gray-500 text-sm italic">No acceptable tree groups formed.</p>
                  ) : (
                    <div className="space-y-6">
                      {response.hierarchies.map((hier, index) => (
                         <div key={index} className="bg-white p-4 rounded shadow-sm border border-gray-200">
                            <div className="flex justify-between items-start mb-4 pb-2 border-b border-gray-100">
                               <div className="flex items-center gap-2">
                                  <span className="font-bold text-lg text-gray-800">Root: {hier.root}</span>
                                  {hier.has_cycle && (
                                     <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider">Cycle warning</span>
                                  )}
                               </div>
                               {!hier.has_cycle && typeof hier.depth === "number" && (
                                  <span className="text-sm text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded border border-blue-200">
                                    Depth: {hier.depth}
                                  </span>
                               )}
                            </div>
                            
                            <div className="overflow-x-auto">
                               {hier.has_cycle ? (
                                  <p className="text-sm text-red-500 italic">Tree construction aborted due to cycle detection.</p>
                               ) : Object.keys(hier.tree).length > 0 ? (
                                  <div className="-ml-4"><RenderTree tree={hier.tree} /></div>
                               ) : (
                                  <p className="text-sm text-gray-500">Single root node with no children.</p>
                               )}
                            </div>
                         </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
