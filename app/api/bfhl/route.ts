import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface TreeNode {
  [key: string]: TreeNode;
}

interface HierarchyNode {
  root: string;
  tree: TreeNode;
  depth?: number;
  has_cycle?: true;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data: string[] = body.data || [];

    const invalid_entries: string[] = [];
    const duplicate_edges: string[] = [];
    const seenEdges = new Set<string>();
    const dupesAdded = new Set<string>();

    const adj = new Map<string, string[]>();
    const hasParent = new Map<string, string>();
    const allNodes = new Set<string>();

    // 1. O(N) Validation & Parsing
    for (let i = 0; i < data.length; i++) {
      const raw = data[i];
      if (typeof raw !== "string") {
        invalid_entries.push(String(raw));
        continue;
      }

      const str = raw.trim();

      // Check valid format X->Y
      if (!/^[A-Z]->[A-Z]$/.test(str)) {
        invalid_entries.push(raw); // raw string including whitespace if any
        continue;
      }

      const u = str[0];
      const v = str[3];

      if (u === v) {
        // Self-loop is invalid
        invalid_entries.push(raw);
        continue;
      }

      // Check duplicates
      if (seenEdges.has(str)) {
        if (!dupesAdded.has(str)) {
          duplicate_edges.push(str);
          dupesAdded.add(str);
        }
        continue;
      }
      seenEdges.add(str);

      // Graph Construction & Multi-Parent Rule
      allNodes.add(u);
      allNodes.add(v);

      if (hasParent.has(v)) {
        // Silently discard subsequent parent edges
        continue;
      }

      hasParent.set(v, u);
      if (!adj.has(u)) adj.set(u, []);
      adj.get(u)!.push(v);
    }

    // 2. Identify Roots & Component Grouping
    const roots = new Set<string>();
    for (const node of allNodes) {
      if (!hasParent.has(node)) {
        roots.add(node);
      }
    }

    const state = new Map<string, "UNVISITED" | "VISITING" | "VISITED">();
    for (const node of allNodes) state.set(node, "UNVISITED");

    // Helper: DFS to build tree and check for cycles
    let isCurrentGroupCyclic = false;

    // DFS returns [subtree_object, depth]
    function dfs(node: string): [TreeNode, number] {
      if (state.get(node) === "VISITING") {
        isCurrentGroupCyclic = true;
        return [{}, 0];
      }
      if (state.get(node) === "VISITED") {
        return [{}, 0]; // shouldn't happen with strict forest aside from multi-parent being filtered out, but safeguard
      }

      state.set(node, "VISITING");
      const children = adj.get(node) || [];
      const treeObj: TreeNode = {};
      let maxDepth = 0;

      // Lexicographically sort children for deterministic output
      const sortedChildren = [...children].sort();

      for (const child of sortedChildren) {
        const [childTree, childDepth] = dfs(child);
        treeObj[child] = childTree;
        maxDepth = Math.max(maxDepth, childDepth);
      }

      state.set(node, "VISITED");
      return [treeObj, maxDepth + 1];
    }

    const hierarchies: HierarchyNode[] = [];
    let total_trees = 0;
    let total_cycles = 0;
    let largest_tree_root = "";
    let max_tree_depth = 0;

    // Process all identified roots
    const sortedRoots = [...roots].sort();
    for (const root of sortedRoots) {
      if (state.get(root) === "UNVISITED") {
        isCurrentGroupCyclic = false;
        const [tree, depth] = dfs(root);

        if (isCurrentGroupCyclic) {
          total_cycles++;
          hierarchies.push({
            root,
            tree: {},
            has_cycle: true,
          });
        } else {
          total_trees++;
          hierarchies.push({
            root,
            tree: { [root]: tree },
            depth,
          });

          // Summary Rules
          if (depth > max_tree_depth) {
            max_tree_depth = depth;
            largest_tree_root = root;
          } else if (depth === max_tree_depth && root < largest_tree_root) {
            largest_tree_root = root; // lexicographically smaller tiebreaker
          } else if (largest_tree_root === "") {
            largest_tree_root = root;
          }
        }
      }
    }

    // 3. Process Pure Cycles (nodes that are unvisited because no root)
    const unvisitedNodes = [...allNodes]
      .filter((n) => state.get(n) === "UNVISITED")
      .sort();
    while (unvisitedNodes.length > 0) {
      // Find a node to start, pick lexicographically smallest among the strongly connected component...
      // For simplicity, just pick the first unvisited node (it's sorted)
      const smallestInCycle = unvisitedNodes.shift()!;
      if (state.get(smallestInCycle) === "UNVISITED") {
        isCurrentGroupCyclic = false;
        dfs(smallestInCycle); // Just to mark them

        // As it's a pure cycle, it's definitely cyclic
        total_cycles++;
        hierarchies.push({
          root: smallestInCycle,
          tree: {},
          has_cycle: true,
        });
      }
    }

    // 4. Send Response
    return NextResponse.json(
      {
        user_id: process.env.USER_ID,
        email_id: process.env.EMAIL_ID,
        college_roll_number:
          process.env.COLLEGE_ROLL_NUMBER,
        hierarchies,
        invalid_entries,
        duplicate_edges,
        summary: {
          total_trees,
          total_cycles,
          largest_tree_root,
        },
      },
      { headers: corsHeaders() },
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON format" },
      { status: 400, headers: corsHeaders() },
    );
  }
}
