import { OverlayConfig } from '@/types/overlay';

export const overlayTemplates: OverlayConfig[] = [
  {
    templateName: 'Chat Overlay',
    customizations: {
      fontSize: '16px',
      colors: {
        primary: '#ffffff',
        secondary: '#00ff00',
        background: 'rgba(0,0,0,0.7)'
      },
      position: {
        x: 10,
        y: 10
      },
      animation: 'fadeIn'
    },
    generatedCode: {
      html: `
<div id="chat-overlay">
  <div class="chat-message">
    <span class="username">{username}</span>: 
    <span class="message">{message}</span>
  </div>
</div>
      `,
      css: `
#chat-overlay {
  position: absolute;
  top: 10px;
  left: 10px;
  width: 300px;
  background: rgba(0,0,0,0.7);
  color: #ffffff;
  font-size: 16px;
  border-radius: 5px;
  padding: 10px;
}

.chat-message {
  margin: 5px 0;
  animation: fadeIn 0.5s ease-in;
}

.username {
  color: #00ff00;
  font-weight: bold;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
      `,
      js: `
function updateChatMessage(username, message) {
  const chatDiv = document.getElementById('chat-overlay');
  const messageDiv = document.createElement('div');
  messageDiv.className = 'chat-message';
  messageDiv.innerHTML = \`<span class="username">\${username}</span>: <span class="message">\${message}</span>\`;
  chatDiv.appendChild(messageDiv);
  
  // Remove old messages if too many
  if (chatDiv.children.length > 10) {
    chatDiv.removeChild(chatDiv.firstChild);
  }
}

// Listen for chat events from OBS or external source
window.addEventListener('message', (event) => {
  if (event.data.type === 'chatMessage') {
    updateChatMessage(event.data.username, event.data.message);
  }
});
      `
    }
  },
  {
    templateName: 'Viewer Count Display',
    customizations: {
      fontSize: '24px',
      colors: {
        primary: '#ffffff',
        secondary: '#ff6b6b',
        background: 'rgba(0,0,0,0.8)'
      },
      position: {
        x: 50,
        y: 10
      },
      animation: 'pulse'
    },
    generatedCode: {
      html: `
<div id="viewer-count">
  <span class="label">Viewers:</span> 
  <span id="viewer-number" class="number">{viewerCount}</span>
</div>
      `,
      css: `
#viewer-count {
  position: absolute;
  top: 10px;
  right: 50px;
  background: rgba(0,0,0,0.8);
  color: #ffffff;
  font-size: 24px;
  padding: 10px 20px;
  border-radius: 25px;
  border: 2px solid #ff6b6b;
  animation: pulse 2s infinite;
}

.label {
  color: #ff6b6b;
  font-weight: bold;
}

.number {
  color: #ffffff;
  margin-left: 5px;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(255, 107, 107, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0); }
}
      `,
      js: `
let viewerCount = 0;

function updateViewerCount(count) {
  viewerCount = count;
  document.getElementById('viewer-number').textContent = count;
  document.getElementById('viewer-count').style.transform = 'scale(1.1)';
  setTimeout(() => {
    document.getElementById('viewer-count').style.transform = 'scale(1)';
  }, 200);
}

// Listen for viewer count updates
window.addEventListener('message', (event) => {
  if (event.data.type === 'viewerCountUpdate') {
    updateViewerCount(event.data.count);
  }
});

// Initial count
updateViewerCount(0);
      `
    }
  },
  {
    templateName: 'Donation Alert',
    customizations: {
      fontSize: '20px',
      colors: {
        primary: '#ffd700',
        secondary: '#ff4500',
        background: 'rgba(0,0,0,0.9)'
      },
      position: {
        x: 20,
        y: 20
      },
      animation: 'slideInUp'
    },
    generatedCode: {
      html: `
<div id="donation-alert" class="alert-hidden">
  <div class="alert-icon">💰</div>
  <div class="alert-content">
    <h3 class="donor-name">{donorName}</h3>
    <p class="donation-amount">Donated ${donorAmount}</p>
    <p class="donation-message">{message}</p>
  </div>
</div>
      `,
      css: `
#donation-alert {
  position: absolute;
  top: 20px;
  left: 20px;
  background: rgba(0,0,0,0.9);
  color: #ffd700;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);
  transform: translateY(100px);
  opacity: 0;
  transition: all 0.5s ease;
  max-width: 300px;
}

.alert-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.donor-name {
  color: #ffd700;
  font-size: 20px;
  margin: 0 0 5px 0;
}

.donation-amount {
  color: #ff4500;
  font-size: 18px;
  font-weight: bold;
  margin: 5px 0;
}

.donation-message {
  color: #ffffff;
  font-size: 14px;
  margin: 5px 0 0 0;
  font-style: italic;
}

.alert-showing {
  transform: translateY(0);
  opacity: 1;
}

@keyframes slideInUp {
  from { transform: translateY(100px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
      `,
      js: `
function showDonationAlert(donorName, amount, message) {
  const alert = document.getElementById('donation-alert');
  alert.querySelector('.donor-name').textContent = donorName;
  alert.querySelector('.donation-amount').textContent = \`Donated \${amount}\`;
  alert.querySelector('.donation-message').textContent = message;
  
  alert.classList.remove('alert-hidden');
  alert.classList.add('alert-showing');
  
  // Hide after 5 seconds
  setTimeout(() => {
    alert.classList.remove('alert-showing');
    setTimeout(() => {
      alert.classList.add('alert-hidden');
    }, 500);
  }, 5000);
}

// Listen for donation events
window.addEventListener('message', (event) => {
  if (event.data.type === 'donationReceived') {
    showDonationAlert(event.data.donorName, event.data.amount, event.data.message);
  }
});
      `
    }
  },
  {
    templateName: 'Scoreboard',
    customizations: {
      fontSize: '18px',
      colors: {
        primary: '#ffffff',
        secondary: '#4169e1',
        background: 'rgba(0,0,0,0.85)'
      },
      position: {
        x: 30,
        y: 30
      },
      animation: 'slideInRight'
    },
    generatedCode: {
      html: `
<div id="scoreboard" class="scoreboard-hidden">
  <div class="team team1">
    <div class="team-name">{team1Name}</div>
    <div class="team-score">{team1Score}</div>
  </div>
  <div class="vs-divider">VS</div>
  <div class="team team2">
    <div class="team-score">{team2Score}</div>
    <div class="team-name">{team2Name}</div>
  </div>
</div>
      `,
      css: `
#scoreboard {
  position: absolute;
  top: 30px;
  right: 30px;
  background: rgba(0,0,0,0.85);
  color: #ffffff;
  padding: 20px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-width: 250px;
  transform: translateX(100%);
  opacity: 0;
  transition: all 0.6s ease;
  border: 2px solid #4169e1;
}

.team {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}

.team1 {
  text-align: left;
}

.team2 {
  text-align: right;
}

.team-name {
  font-size: 18px;
  color: #ffffff;
  margin-bottom: 5px;
  font-weight: bold;
}

.team-score {
  font-size: 32px;
  color: #4169e1;
  font-weight: bold;
}

.vs-divider {
  color: #4169e1;
  font-size: 20px;
  font-weight: bold;
  margin: 0 15px;
}

.scoreboard-showing {
  transform: translateX(0);
  opacity: 1;
}

@keyframes slideInRight {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
      `,
      js: `
function updateScoreboard(team1Name, team1Score, team2Name, team2Score) {
  const scoreboard = document.getElementById('scoreboard');
  scoreboard.querySelector('.team1 .team-name').textContent = team1Name;
  scoreboard.querySelector('.team1 .team-score').textContent = team1Score;
  scoreboard.querySelector('.team2 .team-name').textContent = team2Name;
  scoreboard.querySelector('.team2 .team-score').textContent = team2Score;
  
  scoreboard.classList.remove('scoreboard-hidden');
  scoreboard.classList.add('scoreboard-showing');
}

// Listen for score updates
window.addEventListener('message', (event) => {
  if (event.data.type === 'scoreUpdate') {
    updateScoreboard(
      event.data.team1Name,
      event.data.team1Score,
      event.data.team2Name,
      event.data.team2Score
    );
  }
});

// Initial scores
updateScoreboard('Team A', '0', 'Team B', '0');
      `
    }
  }
];