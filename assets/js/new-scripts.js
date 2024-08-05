document.addEventListener('DOMContentLoaded', () => {
    const elementsList = document.getElementById('elements-list');
    const canvas = document.getElementById('canvas');
    const data = {
        nodes: [],
        links: []
    };

    let isNewElement = false; // Flag to check if the element is new
    let nextCanvasId = 1; // Counter for unique canvas element IDs

    // Handle drag start event for list items
    elementsList.addEventListener('dragstart', (e) => {
        isNewElement = true;
        try {
            const dragData = {
                type: 'list-item',
                id: e.target.dataset.id,
                text: e.target.textContent
            };
            e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
        } catch (err) {
            console.error('Error setting drag data:', err);
        }
    });

    // Handle drag over event for the canvas
    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    // Handle drop event for the canvas
    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        try {
            const droppedData = JSON.parse(e.dataTransfer.getData('text/plain'));

            if (droppedData.type === 'list-item') {
                if (isNewElement) {
                    const uniqueId = `canvas-element-${nextCanvasId++}`; // Generate unique ID
                    const element = document.createElement('div');
                    element.textContent = droppedData.text;
                    element.classList.add('node');
                    element.style.position = 'absolute';
                    element.style.left = `${e.clientX - canvas.offsetLeft}px`;
                    element.style.top = `${e.clientY - canvas.offsetTop}px`;
                    element.dataset.id = uniqueId; // Assign unique ID
                    element.setAttribute('draggable', 'true'); // Set the draggable attribute

                    // Add event listeners for dragging the element within the canvas
                    element.addEventListener('dragstart', onDragStart);
                    element.addEventListener('dragend', onDragEnd);

                    canvas.appendChild(element);

                    const newNode = {
                        id: uniqueId, // Use unique ID
                        x: e.clientX - canvas.offsetLeft,
                        y: e.clientY - canvas.offsetTop,
                        width: element.offsetWidth,
                        height: element.offsetHeight,
                        element: element
                    };

                    let inserted = false;
                    for (let i = 0; i < data.links.length; i++) {
                        const link = data.links[i];
                        const source = link.source;
                        const target = link.target;

                        if (isBetween(source, target, newNode)) {
                            data.links.splice(i, 1);

                            data.links.push({
                                source: source,
                                target: newNode
                            });

                            data.links.push({
                                source: newNode,
                                target: target
                            });

                            inserted = true;
                            break;
                        }
                    }

                    if (!inserted) {
                        data.nodes.push(newNode);

                        if (data.nodes.length > 1) {
                            const sourceNode = data.nodes[data.nodes.length - 2];
                            const targetNode = newNode;

                            data.links.push({
                                source: sourceNode,
                                target: targetNode
                            });
                        }
                    } else {
                        data.nodes.push(newNode);
                    }

                    adjustPositions(newNode);
                    updateGraph();
                }
            } else if (droppedData.type === 'canvas-element') {
                const element = document.querySelector(`[data-id='${droppedData.id}']`);

                if (element) {
                    element.style.left = `${e.clientX - canvas.offsetLeft - droppedData.x}px`;
                    element.style.top = `${e.clientY - canvas.offsetTop - droppedData.y}px`;

                    // Update the node position in the data object
                    const node = data.nodes.find(node => node.id === droppedData.id);
                    if (node) {
                        node.x = e.clientX - canvas.offsetLeft - droppedData.x;
                        node.y = e.clientY - canvas.offsetTop - droppedData.y;
                    }
                    updateGraph();
                }
            }
        } catch (err) {
            console.error('Error handling drop event:', err);
        }
        isNewElement = false; // Reset the flag after drop
    });

    // Handle the drag start event for the canvas elements
    function onDragStart(e) {
        isNewElement = false; // It's not a new element
        try {
            const dragData = {
                type: 'canvas-element',
                id: e.target.dataset.id,
                x: e.clientX - canvas.offsetLeft - parseInt(e.target.style.left),
                y: e.clientY - canvas.offsetTop - parseInt(e.target.style.top)
            };
            e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
        } catch (err) {
            console.error('Error setting drag data in onDragStart:', err);
        }
        console.log('Drag start:', e.target); // Log the element to the console
    }

    // Handle the drag end event for the canvas elements
    function onDragEnd(e) {
        try {
            console.log(e.dataTransfer.getData('text/plain'));
            const draggedData = JSON.parse(e.dataTransfer.getData('text/plain'));

            const element = document.querySelector(`[data-id='${draggedData.id}']`);
            if (element) {
                element.style.left = `${e.clientX - canvas.offsetLeft - draggedData.x}px`;
                element.style.top = `${e.clientY - canvas.offsetTop - draggedData.y}px`;

                // Update the node position in the data object
                const node = data.nodes.find(node => node.id === draggedData.id);
                if (node) {
                    node.x = e.clientX - canvas.offsetLeft - draggedData.x;
                    node.y = e.clientY - canvas.offsetTop - draggedData.y;
                }

                console.log('Drag end:', element); // Log the element to the console
                updateGraph();
            }
        } catch (err) {
            console.error('Error handling drag end event:', err);
        }
    }

    // Check if a node is between two other nodes
    function isBetween(source, target, node) {
        const minX = Math.min(source.x, target.x);
        const maxX = Math.max(source.x, target.x);
        const minY = Math.min(source.y, target.y);
        const maxY = Math.max(source.y, target.y);

        return node.x > minX && node.x < maxX && node.y > minY && node.y < maxY;
    }

    // Adjust positions of nodes to prevent overlap
    function adjustPositions(newNode) {
        const buffer = 20; // space between elements
        const moveRight = newNode.width + buffer;

        data.nodes.forEach(node => {
            if (node !== newNode) {
                if (Math.abs(node.x - newNode.x) < newNode.width + buffer && Math.abs(node.y - newNode.y) < newNode.height + buffer) {
                    node.x += moveRight;
                    node.element.style.left = `${node.x}px`;
                }
            }
        });
    }

    function updateGraph() {
        // Remove any existing SVG elements to prevent stacking multiple SVGs
        d3.selectAll("svg").remove();
    
        // Create a new SVG element and append it to the canvas
        const svg = d3.select('#canvas')
            .append('svg')
            .attr('width', canvas.clientWidth)  // Set width of the SVG
            .attr('height', canvas.clientHeight)  // Set height of the SVG
            .style('position', 'absolute')  // Position the SVG absolutely within the canvas
            .style('top', '0')  // Align SVG to the top of the canvas
            .style('left', '0')  // Align SVG to the left of the canvas
            .style('pointer-events', 'none');  // Ensure the SVG does not interfere with dragging
    
        // Define a marker for arrows to be used at the end of connections
        svg.append('defs').append('marker')
            .attr('id', 'arrow')  // Unique ID for the marker
            .attr('markerWidth', 10)  // Width of the marker
            .attr('markerHeight', 10)  // Height of the marker
            .attr('refX', 5)  // Reference point on the X-axis (where the marker is anchored)
            .attr('refY', 3)  // Reference point on the Y-axis
            .attr('orient', 'auto')  // Auto-orient the marker based on the path direction
            .append('path')
            .attr('d', 'M0,0 L0,6 L9,3 z')  // Define the shape of the arrowhead
            .attr('fill', '#000');  // Set the color of the arrowhead
    
        // Bind data to path elements and create paths for each link
        svg.selectAll('path')
            .data(data.links)  // Bind the links data to the path elements
            .enter()
            .append('path')
            .attr('d', d => {
                // Create an SVG path string for the link
                const startX = d.source.x + d.source.width / 2;  // Start X position at the center of the source node
                const startY = d.source.y + d.source.height / 2;  // Start Y position at the center of the source node
                const endX = d.target.x + d.target.width / 2;  // End X position at the center of the target node
                const endY = d.target.y + d.target.height / 2;  // End Y position at the center of the target node
    
                // Draw a quadratic Bezier curve from the source node to the target node
                return `M${startX},${startY} Q${(startX + endX) / 2},${(startY + endY) / 2 - 50} ${endX},${endY}`;
            })
            .attr('stroke', '#000')  // Set the stroke color to black
            .attr('stroke-width', 2)  // Set the stroke width
            .attr('fill', 'none')  // Ensure the path is not filled
            .attr('marker-end', 'url(#arrow)');  // Attach the arrow marker to the end of the path
    }
});
