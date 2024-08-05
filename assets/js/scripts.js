document.addEventListener('DOMContentLoaded', () => {
    // const elementsList = document.getElementById('elements-list');
    const canvas = document.getElementById('canvas');
    const data = {
        nodes: [],
        links: []
    };

    let isNewElement = false; // Flag to check if the element is new
    let nextCanvasId = 1; // Counter for unique canvas element IDs

    // Add event listeners to each list
    document.querySelectorAll('.elements-list').forEach(list => {
        list.addEventListener('dragstart', dragStart);
    });

    // Handle drag start event for list items
    function dragStart(event) {
        isNewElement = true;
        try {
            const dragData = {
                type: 'list-item',
                id: event.target.dataset.id,
                text: event.target.textContent
            };
            localStorage.setItem('dragData', JSON.stringify(dragData));
        } catch (err) {
            console.error('Error setting drag data:', err);
        }
    }

    // Handle drag over event for the canvas
    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    // Handle drop event for the canvas
    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        try {
            const droppedData = JSON.parse(localStorage.getItem('dragData'));
            if (droppedData.type === 'list-item') {
                if (isNewElement) {
                    const uniqueId = `canvas-element-${nextCanvasId++}`; // Generate unique ID
                    const element = document.createElement('div');
                    // element.textContent = droppedData.text;
                    element.classList.add('node');
                    element.style.position = 'absolute';
                    element.style.left = `${e.clientX - canvas.offsetLeft}px`;
                    element.style.top = `${e.clientY - canvas.offsetTop}px`;
                    element.dataset.id = uniqueId; // Assign unique ID
                    element.setAttribute('draggable', 'true'); // Set the draggable attribute
                    

                    // Apply styles to the node
                    element.style.height = '50px'; // Reduced height
                    element.style.display = 'flex';
                    element.style.alignItems = 'center';
                    element.style.justifyContent = 'center';
                    element.style.border = '1px solid black';
                    element.style.borderRadius = '5px';
                    element.style.color = 'black';

                    // Create a temporary container to measure text width
                    const tempContainer = document.createElement('div');
                    tempContainer.style.position = 'absolute';
                    tempContainer.style.visibility = 'hidden';
                    tempContainer.style.whiteSpace = 'nowrap';
                    tempContainer.style.padding = '5px';
                    tempContainer.style.fontSize = '14px'; // Match the font size used in the node
                    tempContainer.textContent = droppedData.text;
                    document.body.appendChild(tempContainer);

                    // Calculate width and cleanup
                    const textWidth = tempContainer.offsetWidth;
                    document.body.removeChild(tempContainer);

                    // Set width and height of the node
                    element.style.width = `${textWidth + 60}px`; // Add padding

                    // Set background color based on the method type
                    const methodType = droppedData.text.trim().toLowerCase();
                    let backgroundColor = '#fff'; // Default color
                    let iconClass = '';
                    console.log(methodType,"methodType");
                    switch (methodType) {
                        case 'email':
                            backgroundColor = '#a0d7e7'; // Light cyan
                            iconClass = 'fa fa-envelope';
                            break;
                        case 'phone number':
                            backgroundColor = '#d1c4e9'; // Light lavender
                            iconClass = 'fa fa-phone';
                            break;
                        case 'text':
                            backgroundColor = '#ffe0b2'; // Light peach
                            iconClass = 'fa fa-map-marker';
                            break;
                        case 'user':
                            backgroundColor = '#c8e6c9'; // Light green
                            iconClass = 'fa fa-user';
                            break;
                    }
                    

                    element.style.backgroundColor = backgroundColor;

                    // Add icon and text to the node
                    const icon = document.createElement('i');
                    icon.className = iconClass;
                    icon.style.marginRight = '8px';
                    const text = document.createElement('span');
                    text.textContent = droppedData.text;

                    element.appendChild(icon);
                    element.appendChild(text);



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
                    // console.log(data.links.length,"first");
                    
                    for (let i = 0; i < data.links.length; i++) {
                        const link = data.links[i];
                        const source = link.source;
                        const target = link.target;
                        console.log("new node",newNode);
                        // console.log(source, target, newNode);
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
                            // Insert newNode between source and target in the nodes array
                            const sourceIndex = findNodeIndex(source);
                            const targetIndex = findNodeIndex(target);

                            // Ensure correct order
                            if (sourceIndex < targetIndex) {
                                data.nodes.splice(targetIndex, 0, newNode);
                            } else {
                                data.nodes.splice(sourceIndex + 1, 0, newNode);
                            }

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
                        else{
                            const sourceNode = data.nodes[0];
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
        // console.log("ondragstart");
        isNewElement = false; // It's not a new element
        try {
            const dragData = {
                type: 'canvas-element',
                id: e.target.dataset.id,
                x: e.clientX - canvas.offsetLeft - parseInt(e.target.style.left),
                y: e.clientY - canvas.offsetTop - parseInt(e.target.style.top)
            };
            const dataStr = JSON.stringify(dragData);
            localStorage.setItem('dragData', dataStr);
        } catch (err) {
            console.error('Error setting drag data in onDragStart:', err);
        }
        // console.log('Drag start:', e.target); // Log the element to the console
    }

    // Handle the drag end event for the canvas elements
    function onDragEnd(e) {
        // console.log("ondragend");
        try {
            const dataStr = localStorage.getItem('dragData');
            console.log("DataTransfer content from localStorage:", dataStr); // Log the data being retrieved

            if (!dataStr) {
                console.log("No data found in localStorage"); // Log if no data is found
                return;
            }

            const draggedData = JSON.parse(dataStr);
            console.log("Dragged data parsed:", draggedData); // Log the parsed data

            const element = document.querySelector(`[data-id='${draggedData.id}']`);
            console.log(element);
            if (element) {
                element.style.left = `${e.clientX - canvas.offsetLeft - draggedData.x}px`;
                element.style.top = `${e.clientY - canvas.offsetTop - draggedData.y}px`;

                // Update the node position in the data object
                const node = data.nodes.find(node => node.id === draggedData.id);
                console.log(node);
                if (node) {
                    node.x = e.clientX - canvas.offsetLeft - draggedData.x;
                    node.y = e.clientY - canvas.offsetTop - draggedData.y;
                }

                // console.log('Drag end:', element); // Log the element to the console
                updateGraph();
            }
        } catch (err) {
            console.error('Error handling drag end event:', err);
        }
    }

    // Check if a node is between two other nodes
    function isBetween(source, target, node) {
        // console.log("isbetween");
        const minX = Math.min(source.x, target.x);
        const maxX = Math.max(source.x, target.x);
        const minY = Math.min(source.y, target.y);
        const maxY = Math.max(source.y, target.y);
        console.log('node', node);
        return node.x > minX && node.x < maxX && node.y > minY && node.y < maxY;
    }

    // Function to find the index of a node in the nodes array
    function findNodeIndex(node) {
        return data.nodes.findIndex(n => n.id === node.id);
    }

    // Adjust positions of nodes to prevent overlap
    function adjustPositions(newNode) {
        // console.log("adjust position");

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
                // console.log("d-path");
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
    
                // Determine vertical start and end points based on the relative positions of source and target
                if (sourceCenterY < targetCenterY) {
                    startY = sourceCenterY;  // Vertical center of the source element
                    endY = targetCenterY;  // Vertical center of the target element
                } else {
                    startY = sourceCenterY;  // Vertical center of the source element
                    endY = targetCenterY;  // Vertical center of the target element
                }

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
                        // console.log("lol");
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
                        // console.log("lol");
                    }
                    else{
                        endX = endX + target.width/2;
                    }
                    endY = endY + target.height/2;
                    // Path from bottom to top
                    path = `M${startX},${startY} V${(startY + endY) / 2} H${endX} V${endY}`;
                }
            }
                // console.log(path);
                return path;  // Return the generated path data
            })
            .attr('marker-end', 'url(#arrow)')  // Apply the arrow marker at the end of the path
            .style('stroke', '#000')  // Set the stroke color of the path
            .style('fill', 'none');  // Ensure the path is not filled
    }
    
});
