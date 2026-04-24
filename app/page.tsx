"use client";

import { useState } from "react";

interface Summary {
  total_trees: number;
  total_cycles: number;
  largest_tree_root: string;
}

interface HierarchyNode {
  root: string;
  tree: any;
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

const RenderTree = ({ tree, depth = 0 }: { tree: any; depth?: number }) => {
  if (!tree || Object.keys(tree).length === 0) return null;

  const colors = [
    "from-cyan-500 to-blue-500 ring-cyan-400/30",
    "from-blue-500 to-indigo-500 ring-blue-400/30",
    "from-indigo-500 to-purple-500 ring-indigo-400/30",
    "from-purple-500 to-pink-500 ring-purple-400/30",
    "from-pink-500 to-rose-500 ring-pink-400/30"
  ];
  const colorClass = colors[depth % colors.length];

  return (
    <ul className="ml-6 border-l-2 border-white/10 pl-6 mt-3 space-y-3 relative">
      {Object.entries(tree).map(([node, children]) => (
        <li key={node} className="text-gray-300 font-medium relative">
          <div className="absolute -left-6 top-3.5 w-6 h-0.5 bg-white/10" />
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-4 py-1.5 rounded-lg text-sm font-bold bg-gradient-to-r ${colorClass} text-white shadow-lg ring-1`}>
              {node}
            </span>
          </div>
          <RenderTree tree={children} depth={depth + 1} />
        </li>
      ))}
    </ul>
  );
};

export default function Home() {
  const [inputVal, setInputVal] = useState(`[\n  "A->B", "A->C", "B->D", "C->E", "E->F",\n  "X->Y", "Y->Z", "Z->X",\n  "P->Q", "Q->R",\n  "G->H", "G->H", "G->I",\n  "hello", "1->2", "A->"\n]`);
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
    } catch (err: any) {
      setError("Invalid JSON format. Please ensure your input correctly matches the array string format [\"A->B\", \"X->Y\"].");
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
        throw new Error(`API error: ${res.status} ${res.statusText}`);
      }

      const data = await res.json();
      setResponse(data);
    } catch (err: any) {
      setError(err.message || "Failed to reach the API endpoint.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-gray-200 py-12 px-4 font-sans selection:bg-cyan-500/30">
      <main className="max-w-6xl mx-auto space-y-12">
        
        {/* Header Section */}
        <header className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-block mb-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-cyan-400 tracking-wider uppercase">
            SRM Engineering Challenge
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500 drop-shadow-sm">
            Node Hierarchy <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">Analyzer</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mt-4">
            A high-performance algorithmic pipeline transforming raw directed edge models into structured, cycle-detected trees.
          </p>
        </header>

        {/* Input Form Section */}
        <section className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-700 delay-150 fill-mode-both">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="nodes" className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                Raw Edge Input (JSON Array)
              </label>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 rounded-xl blur opacity-30 group-focus-within:opacity-100 transition duration-500" />
                <textarea
                  id="nodes"
                  className="relative w-full h-64 p-5 bg-black/60 border border-white/10 rounded-xl font-mono text-sm text-cyan-50 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all outline-none resize-y placeholder-gray-700"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder='["A->B", "C->D"]'
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-4">
              <p className="text-xs text-gray-500 font-mono">Accepts directed edge arrays. Evaluates cycles and filters multiple parents gracefully.</p>
              <button
                type="submit"
                disabled={loading}
                className={`relative px-8 py-3.5 rounded-xl font-bold text-white transition-all duration-300 shadow-xl overflow-hidden group ${
                  loading ? "bg-gray-800 cursor-not-allowed text-gray-400" : "bg-gradient-to-r from-cyan-600 to-indigo-600 hover:scale-[1.02] hover:shadow-cyan-500/25 active:scale-[0.98]"
                }`}
              >
                {!loading && <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-cyan-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />}
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      Analyzing Structure...
                    </>
                  ) : "Initialize Analysis"}
                </span>
              </button>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-lg text-sm flex items-center gap-3 animate-in slide-in-from-top-2">
                <strong className="font-bold">Execution Error:</strong> {error}
              </div>
            )}
          </form>
        </section>

        {/* Results Dashboard Canvas */}
        {response && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
            
            {/* Horizontal Identity Banner Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: "Developer ID", value: response.user_id, ring: "hover:ring-cyan-500/50" },
                { label: "Contact Endpoint", value: response.email_id, ring: "hover:ring-indigo-500/50" },
                { label: "Academic Roll", value: response.college_roll_number, ring: "hover:ring-purple-500/50" }
              ].map((stat, i) => (
                <div key={i} className={`bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/5 shadow-lg transition-all duration-300 ring-1 ring-transparent ${stat.ring}`}>
                  <span className="text-[0.65rem] text-gray-500 uppercase tracking-widest font-bold block mb-1">{stat.label}</span>
                  <p className="text-gray-100 font-medium truncate font-mono text-sm">{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Left Column: Huge Metrics & Badges */}
              <div className="lg:col-span-4 space-y-6">
                
                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl rounded-full" />
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 border-b border-white/10 pb-3">Computation Metrics</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-center transition hover:bg-black/50">
                      <div className="text-4xl font-black text-cyan-400 mb-1">{response.summary.total_trees}</div>
                      <div className="text-xs text-gray-500 font-medium">Valid Trees</div>
                    </div>
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-center relative overflow-hidden transition hover:bg-black/50">
                      {response.summary.total_cycles > 0 && <div className="absolute inset-0 bg-rose-500/5 animate-pulse" />}
                      <div className={`text-4xl font-black mb-1 ${response.summary.total_cycles > 0 ? "text-rose-500" : "text-gray-400"}`}>
                        {response.summary.total_cycles}
                      </div>
                      <div className="text-xs text-gray-500 font-medium">Cycles Found</div>
                    </div>
                  </div>
                  
                  <div className="bg-black/30 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                    <span className="text-sm text-gray-400 font-medium">Largest Root Prefix</span>
                    <span className="px-3 py-1 bg-white/10 rounded-lg font-mono text-indigo-300 font-bold border border-white/10 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                      {response.summary.largest_tree_root || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-xl space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">Dropped Entries</h3>
                    {response.invalid_entries.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                         {response.invalid_entries.map((entry, i) => (
                           <span key={i} className="inline-flex items-center px-3 py-1 rounded-md text-xs font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                             {entry === "" ? "<blank string>" : entry}
                           </span>
                         ))}
                      </div>
                    ) : <span className="text-sm text-gray-600 italic">Formatting absolutely clean.</span>}
                  </div>

                  <div>
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-white/10 pb-2">Ignored Duplicates</h3>
                    {response.duplicate_edges.length > 0 ? (
                       <div className="flex flex-wrap gap-2">
                         {response.duplicate_edges.map((edge, i) => (
                           <span key={i} className="inline-flex items-center px-3 py-1 rounded-md text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                             {edge}
                           </span>
                         ))}
                      </div>
                    ) : <span className="text-sm text-gray-600 italic">No duplicate edges found.</span>}
                  </div>
                </div>

              </div>

              {/* Right Column: Dynamic Tree Structure Graph */}
              <div className="lg:col-span-8">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden h-full flex flex-col">
                  
                  {/* Tab-like Header */}
                  <div className="px-6 py-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)]" />
                      Structural Output Hierarchy
                    </h3>
                    <span className="text-xs font-mono bg-white/10 px-2.5 py-1.5 rounded text-gray-300 border border-white/10 shadow-inner">
                      Trees & Cycles: {response.hierarchies.length} Output Groups
                    </span>
                  </div>
                  
                  {/* Flow View */}
                  <div className="p-6 md:p-8 overflow-x-auto overflow-y-visible min-h-[30rem]">
                    {response.hierarchies.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-500 space-y-4">
                        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2 shadow-inner">
                           <span className="text-3xl font-light">∅</span>
                        </div>
                        <p className="font-medium text-lg text-gray-400">Zero Logical Trees Formed</p>
                        <p className="text-sm text-gray-600">Ensure endpoints connect properly without total disassociation.</p>
                      </div>
                    ) : (
                      <div className="space-y-12 pb-10">
                        {response.hierarchies.map((hier, index) => (
                           <div key={index} className="relative group section-node">
                              
                              {/* Core Head (Root Component) */}
                              <div className="flex items-center gap-4 mb-6">
                                 <div className={`p-1.5 rounded-xl border ${hier.has_cycle ? 'bg-rose-500/10 border-rose-500/20' : 'bg-cyan-500/10 border-cyan-500/20'}`}>
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-black text-2xl shadow-lg ${hier.has_cycle ? 'bg-rose-500/90 text-white' : 'bg-cyan-500/90 text-white'}`}>
                                      {hier.root}
                                    </div>
                                 </div>
                                 <div className="space-y-1">
                                  <div className="flex items-center gap-3">
                                    <h4 className="text-xl font-bold text-gray-100">Origin Root</h4>
                                    {hier.has_cycle && (
                                       <span className="px-3 py-1 rounded-md bg-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-widest border border-rose-500/30 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                                         Cycle Detected
                                       </span>
                                    )}
                                  </div>
                                  {!hier.has_cycle && typeof hier.depth === "number" && (
                                     <p className="text-sm text-gray-400 font-mono tracking-wide">Calculated Max Depth: <span className="text-cyan-400 font-bold ml-1">{hier.depth}</span></p>
                                  )}
                                 </div>
                              </div>
                              
                              {/* Recursive Children Container */}
                              <div className="pl-6 pt-1">
                                 {hier.has_cycle ? (
                                    <div className="ml-2 inline-block px-5 py-3.5 bg-red-950/40 border border-rose-500/20 rounded-xl text-sm font-mono text-rose-400/80 italic shadow-inner">
                                      ↳ Aborted rendering to prevent infinite client loop overflow.
                                    </div>
                                 ) : Object.keys(hier.tree).length > 0 ? (
                                    <div className="-ml-5">
                                      {/* Skip rendering the root again, just render its actual children */}
                                      <RenderTree tree={hier.tree[hier.root]} depth={0} />
                                    </div>
                                 ) : (
                                    <div className="ml-2 px-5 py-3.5 bg-white/5 border border-white/10 rounded-xl text-sm font-mono text-gray-500 inline-block shadow-inner w-auto">
                                      ↳ Single isolated node component.
                                    </div>
                                 )}
                              </div>
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </section>
        )}
      </main>
    </div>
  );
}
