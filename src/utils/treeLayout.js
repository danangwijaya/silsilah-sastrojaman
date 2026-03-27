export const CARD_W = 200, CARD_H = 300, COUPLE_GAP = 20, SIBLING_SEP = 40, GEN_SEP = 60;

function findSpouses(nodes, nodeId) {
    const node = nodes[nodeId];
    if (!node) return [];
    return node.relations.filter(r => r.type === 'spouse').map(r => r.to);
}

function findChildren(nodes, infos, nodeId) {
    const node = nodes[nodeId];
    if (!node) return [];
    let childRels = node.relations.filter(r => r.type === 'child');
    childRels.sort((a, b) => {
        const infoA = infos[a.to];
        const infoB = infos[b.to];
        const orderA = infoA && infoA.childOrder !== undefined && infoA.childOrder !== '' ? Number(infoA.childOrder) : 999;
        const orderB = infoB && infoB.childOrder !== undefined && infoB.childOrder !== '' ? Number(infoB.childOrder) : 999;
        
        if (orderA !== orderB) return orderA - orderB;
        if (a.addedAt && b.addedAt) return new Date(a.addedAt) - new Date(b.addedAt);
        return 0;
    });
    return childRels.map(r => r.to);
}

function buildHierarchy(nodes, infos, customRootId) {
    const visited = new Set();

    function buildSub(pid, sids, depth) {
        if (visited.has(pid)) return null;
        visited.add(pid);
        sids.forEach(sid => visited.add(sid));

        const children = findChildren(nodes, infos, pid);
        const childNodes = [];
        for (const cid of children) {
            if (visited.has(cid)) continue;
            let cSpouses = findSpouses(nodes, cid);
            cSpouses = cSpouses.filter(s => !visited.has(s));
            const sub = buildSub(cid, cSpouses, depth + 1);
            if (sub) childNodes.push(sub);
        }
        return { id: pid, spouseIds: sids, children: childNodes, depth };
    }

    if (customRootId && nodes[customRootId]) {
        let spouses = findSpouses(nodes, customRootId);
        return buildSub(customRootId, spouses, 0) || { id: customRootId, spouseIds: [], children: [], depth: 0 };
    }

    const noParents = new Set();
    for (const [id, node] of Object.entries(nodes)) {
        if (!node.relations.some(r => r.type === 'parent')) noParents.add(id);
    }

    const rootCouples = [];
    const usedRoots = new Set();
    for (const rootId of noParents) {
        if (usedRoots.has(rootId)) continue;
        const spouses = findSpouses(nodes, rootId);
        const unusedSpouses = spouses.filter(s => !usedRoots.has(s));
        
        rootCouples.push({ primary: rootId, spouses: unusedSpouses });
        usedRoots.add(rootId); 
        unusedSpouses.forEach(s => usedRoots.add(s));
    }

    const trees = [];
    for (const rc of rootCouples) {
        const t = buildSub(rc.primary, rc.spouses, 0);
        if (t) trees.push(t);
    }
    if (trees.length === 1) return trees[0];
    return { id: 'virtual-root', spouseIds: [], children: trees, depth: 0 };
}

function calcCoupleBlockWidth(spouseCount) {
    return CARD_W + spouseCount * (CARD_W + COUPLE_GAP);
}

function calcSubtreeWidth(node) {
    const cw = calcCoupleBlockWidth(node.spouseIds ? node.spouseIds.length : 0);
    if (!node.children || !node.children.length) return cw;
    let total = 0;
    for (let i = 0; i < node.children.length; i++) {
        total += calcSubtreeWidth(node.children[i]);
        if (i < node.children.length - 1) total += SIBLING_SEP;
    }
    return Math.max(total, cw);
}

function shiftAll(node, offset, positions) {
    if (positions[node.id]) positions[node.id].x += offset;
    if (node.spouseIds) {
        node.spouseIds.forEach(sid => {
            if (positions[sid]) positions[sid].x += offset;
        });
    }
    if (node.children) node.children.forEach(c => shiftAll(c, offset, positions));
}

function layoutSubtree(node, x, y, positions) {
    const sCount = node.spouseIds ? node.spouseIds.length : 0;
    const cw = calcCoupleBlockWidth(sCount);
    
    if (!node.children || !node.children.length) {
        positions[node.id] = { x, y, node };
        if (node.spouseIds) {
            node.spouseIds.forEach((sid, idx) => {
                positions[sid] = { x: x + (idx + 1) * (CARD_W + COUPLE_GAP), y, node, isSpouse: true };
            });
        }
        return;
    }
    let totalCW = 0;
    const childWidths = [];
    for (let i = 0; i < node.children.length; i++) {
        const w = calcSubtreeWidth(node.children[i]);
        childWidths.push(w);
        totalCW += w;
        if (i < node.children.length - 1) totalCW += SIBLING_SEP;
    }
    let cx = x;
    for (let i = 0; i < node.children.length; i++) {
        layoutSubtree(node.children[i], cx, y + CARD_H + GEN_SEP, positions);
        cx += childWidths[i];
        if (i < node.children.length - 1) cx += SIBLING_SEP;
    }
    const center = x + Math.max(totalCW, cw) / 2;
    const px = center - cw / 2;
    
    positions[node.id] = { x: Math.max(x, px), y, node };
    if (node.spouseIds) {
        node.spouseIds.forEach((sid, idx) => {
            positions[sid] = { x: Math.max(x, px) + (idx + 1) * (CARD_W + COUPLE_GAP), y, node, isSpouse: true };
        });
    }
    
    if (cw > totalCW) {
        const off = (cw - totalCW) / 2;
        for (const c of node.children) shiftAll(c, off, positions);
    }
}

export function calculateTreeLayout(treeData, rootId) {
    if (!treeData || !treeData.nodes || Object.keys(treeData.nodes).length === 0) {
        return { positions: [], lines: [], bounds: { w: 0, h: 0 } };
    }
    const { nodes, infos } = treeData;
    const hierarchy = buildHierarchy(nodes, infos, rootId);
    const posMap = {};
    layoutSubtree(hierarchy, 0, 0, posMap);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [id, pos] of Object.entries(posMap)) {
        if (id === 'virtual-root') continue;
        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x + CARD_W);
        maxY = Math.max(maxY, pos.y + CARD_H);
    }
    const pad = 120;
    const tw = maxX === -Infinity ? pad * 2 : maxX - minX + pad * 2;
    const th = maxY === -Infinity ? pad * 2 : maxY - minY + pad * 2;
    
    if (minX !== Infinity) {
        for (const pos of Object.values(posMap)) {
            pos.x -= minX - pad;
            pos.y -= minY - pad;
        }
    }

    const positions = Object.entries(posMap).filter(([k]) => k !== 'virtual-root').map(([k, v]) => ({ id: k, ...v }));

    const lines = [];
    function traverseChildren(node) {
        if (!node.children || !node.children.length) return;
        const pos = posMap[node.id];
        if (!pos) return;
        
        const sCount = node.spouseIds ? node.spouseIds.length : 0;
        const cw = calcCoupleBlockWidth(sCount);
        const fromX = pos.x + cw / 2;
        const fromY = pos.y + CARD_H;

        for (const child of node.children) {
            const cp = posMap[child.id];
            if (!cp) continue;
            
            const csCount = child.spouseIds ? child.spouseIds.length : 0;
            const ccw = calcCoupleBlockWidth(csCount);
            
            const toX = cp.x + ccw / 2;
            const toY = cp.y;
            const midY = fromY + (toY - fromY) * 0.5;

            lines.push({
                id: `child-${node.id}-${child.id}`,
                type: 'child',
                d: `M${fromX} ${fromY} C${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`
            });
            traverseChildren(child);
        }
    }
    traverseChildren(hierarchy);

    for (const [id, pos] of Object.entries(posMap)) {
        if (pos.isSpouse || id === 'virtual-root') continue;
        const nd = pos.node;
        if (nd && nd.spouseIds) {
            nd.spouseIds.forEach(sid => {
                if (posMap[sid]) {
                    const sp = posMap[sid];
                    lines.push({
                        id: `spouse-${id}-${sid}`,
                        type: 'spouse',
                        x1: sp.x - COUPLE_GAP, y1: sp.y + CARD_H / 2,
                        x2: sp.x, y2: sp.y + CARD_H / 2,
                        midX: sp.x - COUPLE_GAP / 2,
                        midY: pos.y + CARD_H / 2
                    });
                }
            })
        }
    }

    return { positions, lines, bounds: { w: tw, h: th } };
}
