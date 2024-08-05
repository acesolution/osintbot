document.addEventListener('DOMContentLoaded', () => {
    const elementsList = document.getElementById('elements-list');
    const canvas = document.getElementById('canvas');
    const data = {
        nodes: [],
        links: []
    };

    let isNewElement = false; // Flag to check if the element is new
    let nextCanvasId = 1; // Counter for unique canvas element IDs
    console.log(isNewElement);
    // Handle drag start event for list items
    elementsList.addEventListener('dragstart', (e) => {
        console.log("dragstart");
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
        console.log("dragover")
        e.preventDefault();
    });

    // Handle drop event for the canvas
    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        console.log("drop");
        try {
            const droppedData = JSON.parse(e.dataTransfer.getData('text/plain'));
            console.log(droppedData);
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
                    console.log(element);
                    const newNode = {
                        id: uniqueId, // Use unique ID
                        x: e.clientX - canvas.offsetLeft,
                        y: e.clientY - canvas.offsetTop,
                        width: element.offsetWidth,
                        height: element.offsetHeight,
                        element: element
                    };

                    let inserted = false;
                    console.log(data.links.length);
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
                        console.log("not inserted")
                        data.nodes.push(newNode);

                        if (data.nodes.length > 1) {
                            const sourceNode = data.nodes[data.nodes.length - 2];
                            const targetNode = newNode;

                            data.links.push({
                                source: sourceNode,
                                target: targetNode
                            });
                        }
                    }

                    adjustPositions(newNode);
                }
            } else if (droppedData.type === 'canvas-element') {
                const element = document.querySelector(`[data-id='${droppedData.id}']`);
                console.log(element);
                if (element) {
                    element.style.left = `${e.clientX - canvas.offsetLeft - droppedData.x}px`;
                    element.style.top = `${e.clientY - canvas.offsetTop - droppedData.y}px`;

                    // Update the node position in the data object
                    const node = data.nodes.find(node => node.id === droppedData.id);
                    if (node) {
                        node.x = e.clientX - canvas.offsetLeft - droppedData.x;
                        node.y = e.clientY - canvas.offsetTop - droppedData.y;
                    }
                }
            }
            updateGraph();
        } catch (err) {
            console.error('Error handling drop event:', err);
        }
        isNewElement = false; // Reset the flag after drop
    });

    // Handle the drag start event for the canvas elements
    function onDragStart(e) {
        console.log("ondragstart");
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
        console.log("ondragend");
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
        console.log("isbetween");
        const minX = Math.min(source.x, target.x);
        const maxX = Math.max(source.x, target.x);
        const minY = Math.min(source.y, target.y);
        const maxY = Math.max(source.y, target.y);

        return node.x > minX && node.x < maxX && node.y > minY && node.y < maxY;
    }

    // Adjust positions of nodes to prevent overlap
    function adjustPositions(newNode) {
        console.log("adjust position");

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
            .data(data.links)  // Bind the data.links array to path elements
            .enter()  // Handle data for each link
            .append('path')
            .attr('d', d => {
                console.log("d-path");
                const source = d.source;  // Source element
                const target = d.target;  // Target element
    
                // Calculate center points of source and target elements
                const sourceCenterX = source.x + source.width / 2;
                const sourceCenterY = source.y + source.height / 2;
                const targetCenterX = target.x + target.width / 2;
                const targetCenterY = target.y + target.height / 2;
    
                // Initialize variables for path start and end points
                let startX, startY, endX, endY;
                let path = '';
    
                // Offset to move the connection point outside the element
                const offset = 20;
    
                // Determine the connection points
                if (sourceCenterX < targetCenterX) {
                    startX = source.x + source.width;  // Right edge of the source element
                    endX = target.x;  // Left edge of the target element
    
                    // If the startX is greater than endX, adjust the endX and path for specific conditions
                    if (startX > endX) {
                        endX = endX + target.width / 2;  // Adjust endX for a downward arrow
                    }
                    
                } else {
                    startX = source.x;  // Left edge of the source element
                    endX = target.x + target.width;  // Right edge of the target element
                }
    
                // Log values for debugging
                console.log("startX", startX);
                console.log("endX", endX);
                console.log("sourceCenterY", sourceCenterY);
                console.log("targetCenterY", targetCenterY);
    
                // Determine vertical start and end points based on the relative positions of source and target
                if (sourceCenterY < targetCenterY) {
                    startY = sourceCenterY;  // Vertical center of the source element
                    endY = targetCenterY;  // Vertical center of the target element
                } else {
                    startY = sourceCenterY;  // Vertical center of the source element
                    endY = targetCenterY;  // Vertical center of the target element
                }
    
                // Log values for debugging
                console.log("startY", startY);
                console.log("endY", endY);
    
                // Create the path for the connection
            // Create the path for the connection
            if (Math.abs(sourceCenterX - targetCenterX) > Math.abs(sourceCenterY - targetCenterY)) {
                // Mostly horizontal path
                if (sourceCenterX < targetCenterX) {
                    // Path from left to right
                    path = `M${startX},${startY} H${(startX + endX) / 2} V${endY} H${endX}`;
                } else {
                    // Path from right to left
                    path = `M${startX},${startY} H${(startX + endX) / 2} V${endY} H${endX}`;
                }
            } else {
                // Mostly vertical path
                if (sourceCenterY < targetCenterY) {

                    if (sourceCenterX > targetCenterX){
                        startX = startX + source.width/2;
                        endX = endX - target.width/2;
                    }
                    else{
                        startX = startX - source.width/2 ;
                    }
                    startY = startY + source.height/2;
                    
                    if (sourceCenterX + source.width/2 > targetCenterX - target.width/2){
                        console.log("lol");
                    }
                    else{
                        endX = endX + target.width/2;
                    }
                    endY = endY - target.height/2;
                    
                    // Path from top to bottom
                    path = `M${startX},${startY} V${(startY + endY) / 2} H${endX} V${endY}`;
                } else {
                    if (sourceCenterX > targetCenterX){
                        startX = startX + source.width/2;
                        endX = endX - target.width/2;
                    }
                    else{
                        startX = startX - source.width/2 ;
                    }
                    startY = startY - source.height/2;
                    
                    if (sourceCenterX + source.width/2 > targetCenterX - target.width/2){
                        console.log("lol");
                    }
                    else{
                        endX = endX + target.width/2;
                    }
                    endY = endY + target.height/2;
                    // Path from bottom to top
                    path = `M${startX},${startY} V${(startY + endY) / 2} H${endX} V${endY}`;
                }
            }
                console.log(path);
                return path;  // Return the generated path data
            })
            .attr('marker-end', 'url(#arrow)')  // Apply the arrow marker at the end of the path
            .style('stroke', '#000')  // Set the stroke color of the path
            .style('fill', 'none');  // Ensure the path is not filled
    }
    
});
