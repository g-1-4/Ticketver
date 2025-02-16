let qrScanner;
        let cameraRunning = false;
        const toggleButton = document.getElementById('toggle-camera');

        function showStatusCard(status, ticketData = {}) {
            const scanner = document.getElementById('qr-reader');
            scanner.style.display = 'none';

            const statusCardContainer = document.getElementById('status-card-container');
            const overlay = document.getElementById('overlay');
            let statusCardContent = '';
            let statusClass = '';

            if (status === 'unused') {
                statusClass = 'valid';
                statusCardContent = `
                    <div class="status-card ${statusClass}">
                        <h2>VALID</h2>
                        <div class="ticket-info">
                            <p>Ticket ID: ${ticketData.ticketId}</p>
                            <p>Valid QR Code</p>
                        </div>
                        <button onclick="hideStatusCard()"><strong>SCAN NEW TICKET</strong></button>
                    </div>
                `;
            } else if (status === 'used') {
                statusClass = 'used';
                statusCardContent = `
                    <div class="status-card ${statusClass}">
                        <h2>USED</h2>
                        <div class="ticket-info">
                            <p>Ticket ID: ${ticketData.ticketId}</p>
                            <p>Used QR Code, Check!</p>
                        </div>
                        <button onclick="hideStatusCard()"><strong>SCAN NEW TICKET</strong></button>
                    </div>
                `;
            } else if (status === 'vip') {
                statusClass = 'vip';
                statusCardContent = `
                    <div class="status-card ${statusClass}">
                        <h2>VIP TICKET</h2>
                        <div class="ticket-info">
                            <p>Ticket ID: ${ticketData.ticketId}</p>
                            <p>Valid VIP QR Code</p>
                        </div>
                        <button onclick="hideStatusCard()"><strong>SCAN NEW TICKET</strong></button>
                    </div>
                `;
            } else {
                statusClass = 'invalid';
                statusCardContent = `
                    <div class="status-card ${statusClass}">
                        <h2>INVALID</h2>
                        <p>Invalid QR Code</p>
                        <button onclick="hideStatusCard()"><strong>SCAN NEW TICKET</strong></button>
                    </div>
                `;
            }

            statusCardContainer.innerHTML = statusCardContent;
            statusCardContainer.style.display = 'block';
            overlay.style.display = 'block';

            toggleButton.style.display = 'none';
        }
        function hideStatusCard() {
            const scanner = document.getElementById('qr-reader');
            scanner.style.display = 'block';

            const statusCardContainer = document.getElementById('status-card-container');
            const overlay = document.getElementById('overlay');
            statusCardContainer.style.display = 'none';
            overlay.style.display = 'none';

            toggleButton.style.display = 'block';

            if (qrScanner) {
                qrScanner.resume();
            }
        }
        function onScanSuccess(decodedText) {
            const ticketNumber = decodedText.split(":")[0];

            fetch("https://ticketverbackend.onrender.com/verify-ticket", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ticket_id: decodedText })
            })
                .then(response => response.json())
                .then(data => {
                    let status = data.status;
                    let type = data.type; // vip or regular
                    let ticketData = { ticketId: ticketNumber, type };

                    console.log("API Response:", data);
                    if (status === "unused" && type === "vip") {
                        showStatusCard("vip", ticketData);
                    } else if (status === "unused") {
                        showStatusCard("unused", ticketData);
                    } else if (status === "used") {
                        showStatusCard("used", ticketData);
                    } else if (status === "invalid") {
                        showStatusCard("invalid", ticketData);
                    }
                })

                .catch(error => console.error("Error verifying ticket:", error));

            if (qrScanner) {
                qrScanner.pause();
            }
        }

        toggleButton.addEventListener('click', function () {
            const qrReaderDiv = document.getElementById('qr-reader');

            if (!cameraRunning) {
                qrScanner = new Html5Qrcode("qr-reader");
                qrReaderDiv.style.display = 'block';

                qrScanner.start({
                    facingMode: "environment"
                }, {
                    fps: 15,
                    qrbox: (viewfinderWidth, viewfinderHeight) => {
                        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                        return {
                            width: minEdge * 0.8,
                            height: minEdge * 0.8
                        };
                    },
                    useBarCodeDetectorIfSupported: true
                }, onScanSuccess).catch(err => {
                    console.error('Camera Start Error:', err);
                    alert("Camera failed to start. Check permissions or try a different camera.");
                });

                toggleButton.innerText = 'Stop Camera';
                cameraRunning = true;
            } else {
                qrScanner.stop().then(() => {
                    qrReaderDiv.innerHTML = '';
                    qrReaderDiv.style.display = 'none';
                    toggleButton.innerText = 'Start Camera';
                    cameraRunning = false;
                    document.getElementById('status-card-container').innerHTML = '';
                }).catch(err => console.error('Camera Stop Error:', err));
            }
        });