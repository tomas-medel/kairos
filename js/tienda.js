/* ========================================
   KAIROS — Tienda Screen
   ======================================== */

function renderTienda() {
    const items = getShopItems();
    const puntos = getPoints();
    const container = document.getElementById('main-content');

    let html = `
    <div class="section-header">
      <span class="section-icon">🛍️🎁✨</span>
      <h2>Tienda</h2>
      <p>Gasta tus puntos en recompensas</p>
    </div>
  `;

    if (items.length === 0) {
        html += `
      <div class="day-off" style="padding: var(--space-md);">
        <p style="color: var(--text-secondary);">Agrega recompensas desde Ajustes ⚙️</p>
      </div>
    `;
    }

    items.forEach((item, i) => {
        const canBuy = puntos >= item.precio;
        html += `
      <div class="shop-item" style="animation-delay: ${i * 0.06}s">
        <div class="item-emoji">${item.emoji || '🎁'}</div>
        <div class="item-info">
          <div class="item-name">${item.nombre}</div>
          <div class="item-price">${item.precio} pts</div>
        </div>
        <button class="btn-buy" onclick="handleBuy('${item.id}')" ${!canBuy ? 'disabled' : ''}>
          Comprar
        </button>
      </div>
    `;
    });

    html += `
    <p style="text-align:center;color:var(--text-secondary);margin-top:var(--space-md);">
      Las recompensas se gestionan desde Ajustes → Tienda.
    </p>
  `;

    container.innerHTML = html;
}

function handleBuy(id) {
    const success = buyItem(id);
    if (success) {
        showPointsPop(false);
        showToast('¡Recompensa comprada! 🎉');
        updateHeaderPoints();
        renderTienda();
    }
}

function openShopModal() {
    showModal(`
    <h3>Nueva Recompensa</h3>
    <div class="form-group">
      <label>Nombre</label>
      <input type="text" class="form-input" id="modal-name" placeholder="Ej: Helado">
    </div>
    <div class="form-group">
      <label>Emoji</label>
      <div class="emoji-grid" id="modal-emoji-grid"></div>
    </div>
    <div class="form-group">
      <label>Precio (puntos)</label>
      <input type="number" class="form-input" id="modal-price" placeholder="250" min="1">
    </div>
    <button class="btn-primary" onclick="saveShopItem()">Guardar</button>
    <button class="btn-secondary" onclick="closeModal()">Cancelar</button>
  `);

    renderEmojiGrid('modal-emoji-grid', ['🍦', '🍕', '🎬', '🎮', '🛒', '☕', '🍔', '🎧', '🏖️', '🎂', '🧁', '🎁']);
}

function saveShopItem() {
    const nombre = document.getElementById('modal-name').value.trim();
    const precio = parseInt(document.getElementById('modal-price').value) || 0;
    const emoji = getSelectedEmoji() || '🎁';

    if (!nombre || precio <= 0) {
        showToast('Completa todos los campos');
        return;
    }

    addShopItem({ nombre, emoji, precio });
    closeModal();
    renderTienda();
    showToast('Recompensa agregada ✨');
}
