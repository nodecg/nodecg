import { useRef } from '../use-ref.js';
import { readlineWidth } from '../utils.js';
import { lines } from './lines.js';
import { finite, infinite } from './position.js';
export function usePagination({ items, active, renderItem, pageSize, loop = true, }) {
    const state = useRef({ position: 0, lastActive: 0 });
    const position = loop
        ? infinite({
            active,
            lastActive: state.current.lastActive,
            total: items.length,
            pageSize,
            pointer: state.current.position,
        })
        : finite({
            active,
            total: items.length,
            pageSize,
        });
    state.current.position = position;
    state.current.lastActive = active;
    return lines({
        items,
        width: readlineWidth(),
        renderItem,
        active,
        position,
        pageSize,
    }).join('\n');
}
