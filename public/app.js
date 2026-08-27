// EstateHub Client Application Logic

const state = {
  user: JSON.parse(localStorage.getItem('estate_user')) || null,
  token: localStorage.getItem('estate_token') || null,
  currentView: 'properties',
  authMode: 'login', // 'login' or 'register'
  properties: [],
  favorites: [],
  debounceTimer: null
};

// API Helper with Auth
async function api(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Request failed');
    }
    return data;
  } catch (err) {
    showToast(err.message, 'error');
    throw err;
  }
}

// Toast Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-emerald-600' : (type === 'error' ? 'bg-rose-600' : 'bg-slate-800');
  const icon = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-info');

  toast.className = `${bgColor} text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-sm font-medium animate-in slide-in-from-bottom-3 duration-200 pointer-events-auto`;
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
  
  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// Auth UI Updates
function updateAuthUI() {
  const loggedInContainer = document.getElementById('auth-logged-in');
  const loggedOutContainer = document.getElementById('auth-logged-out');
  const navAgent = document.getElementById('nav-agent');
  const navAdmin = document.getElementById('nav-admin');
  const navFavorites = document.getElementById('nav-favorites');
  const btnAddProperty = document.getElementById('btn-add-property-container');

  if (state.user && state.token) {
    loggedInContainer.classList.remove('hidden');
    loggedOutContainer.classList.add('hidden');
    document.getElementById('user-display-name').textContent = `${state.user.firstName || ''} ${state.user.lastName || ''}`.trim() || state.user.email;
    
    const roleBadge = document.getElementById('user-role-badge');
    roleBadge.textContent = state.user.role;
    roleBadge.className = `px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-md ${
      state.user.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-800' : (state.user.role === 'AGENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800')
    }`;

    // Strict Role-based navigation visibility
    if (state.user.role === 'ADMIN') {
      navAdmin.classList.remove('hidden');   // Only Admin
      navAgent.classList.add('hidden');
      navFavorites.classList.add('hidden');  // Hidden for Admin
      btnAddProperty.classList.remove('hidden');
      
      // If on an unauthorized tab, redirect to admin console
      if (state.currentView === 'agent' || state.currentView === 'favorites') {
        showView('admin');
        return;
      }
    } else if (state.user.role === 'AGENT') {
      navAdmin.classList.add('hidden');
      navAgent.classList.remove('hidden');   // Only Agent
      navFavorites.classList.add('hidden');  // Hidden for Agent
      btnAddProperty.classList.remove('hidden');
      
      // If on an unauthorized tab, redirect to agent dashboard
      if (state.currentView === 'admin' || state.currentView === 'favorites') {
        showView('agent');
        return;
      }
    } else { // CLIENT
      navAdmin.classList.add('hidden');
      navAgent.classList.add('hidden');
      navFavorites.classList.remove('hidden'); // Only Client
      btnAddProperty.classList.add('hidden');

      if (state.currentView === 'admin' || state.currentView === 'agent') {
        showView('properties');
        return;
      }
    }
  } else {
    loggedInContainer.classList.add('hidden');
    loggedOutContainer.classList.remove('hidden');
    navAdmin.classList.add('hidden');
    navAgent.classList.add('hidden');
    navFavorites.classList.add('hidden');
    btnAddProperty.classList.add('hidden');

    if (state.currentView === 'admin' || state.currentView === 'agent' || state.currentView === 'favorites') {
      showView('properties');
      return;
    }
  }
}

// Navigation View Switcher with Strict Role Guards
function showView(viewId) {
  // Role Access Guard
  if (viewId === 'admin') {
    if (!state.user || state.user.role !== 'ADMIN') {
      showToast('Access Denied: Admin role required', 'error');
      viewId = 'properties';
    }
  } else if (viewId === 'agent') {
    if (!state.user || state.user.role !== 'AGENT') {
      showToast('Access Denied: Agent role required', 'error');
      viewId = 'properties';
    }
  } else if (viewId === 'favorites') {
    if (!state.user || state.user.role !== 'CLIENT') {
      showToast('Saved favorites are available for Client accounts', 'info');
      viewId = state.user?.role === 'ADMIN' ? 'admin' : (state.user?.role === 'AGENT' ? 'agent' : 'properties');
    }
  }

  state.currentView = viewId;
  const views = ['properties', 'agent', 'admin', 'favorites'];
  
  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    const navBtn = document.getElementById(`nav-${v}`);
    if (v === viewId) {
      el.classList.remove('hidden');
      if (navBtn) {
        navBtn.className = 'px-3.5 py-2 rounded-lg text-sm font-medium transition-all text-teal-700 bg-teal-50/80';
      }
    } else {
      el.classList.add('hidden');
      if (navBtn) {
        navBtn.className = 'px-3.5 py-2 rounded-lg text-sm font-medium transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-100';
      }
    }
  });

  if (viewId === 'properties') fetchProperties();
  if (viewId === 'agent') fetchAgentData();
  if (viewId === 'admin') fetchAdminData();
  if (viewId === 'favorites') fetchFavoritesData();
}

// Modal Handlers
function openLoginModal() {
  state.authMode = 'login';
  document.getElementById('modal-auth-title').textContent = 'Welcome Back';
  document.getElementById('modal-auth-subtitle').textContent = 'Sign in to access your real estate portal';
  document.getElementById('auth-register-fields').classList.add('hidden');
  document.getElementById('auth-submit-btn').textContent = 'Sign In';
  document.getElementById('auth-switch-text').textContent = "Don't have an account?";
  document.getElementById('auth-switch-btn').textContent = 'Register as Client';
  document.getElementById('modal-auth').classList.remove('hidden');
}

function openRegisterModal() {
  state.authMode = 'register';
  document.getElementById('modal-auth-title').textContent = 'Create Account';
  document.getElementById('modal-auth-subtitle').textContent = 'Join EstateHub to browse and save listings';
  document.getElementById('auth-register-fields').classList.remove('hidden');
  document.getElementById('auth-submit-btn').textContent = 'Create Account';
  document.getElementById('auth-switch-text').textContent = 'Already have an account?';
  document.getElementById('auth-switch-btn').textContent = 'Sign In';
  document.getElementById('modal-auth').classList.remove('hidden');
}

function toggleAuthMode() {
  if (state.authMode === 'login') openRegisterModal();
  else openLoginModal();
}

function closeAuthModal() {
  document.getElementById('modal-auth').classList.add('hidden');
}

// Quick Demo Login
async function quickLogin(email, password) {
  try {
    const res = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    state.user = res.data;
    state.token = res.accessToken;
    localStorage.setItem('estate_user', JSON.stringify(res.data));
    localStorage.setItem('estate_token', res.accessToken);
    updateAuthUI();
    showToast(`Logged in as ${res.data.role} (${res.data.firstName || res.data.email})`);
    if (res.data.role === 'AGENT') showView('agent');
    else if (res.data.role === 'ADMIN') showView('admin');
    else showView('properties');
  } catch (err) {
    // Handled in api()
  }
}

// Auth Submit
async function handleAuthSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('auth-email').value;
  const password = document.getElementById('auth-password').value;

  try {
    if (state.authMode === 'login') {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      state.user = res.data;
      state.token = res.accessToken;
      localStorage.setItem('estate_user', JSON.stringify(res.data));
      localStorage.setItem('estate_token', res.accessToken);
      closeAuthModal();
      updateAuthUI();
      showToast(`Welcome back, ${res.data.firstName || res.data.email}!`);
      if (res.data.role === 'AGENT') showView('agent');
      else if (res.data.role === 'ADMIN') showView('admin');
      else showView('properties');
    } else {
      const firstName = document.getElementById('auth-firstname').value;
      const lastName = document.getElementById('auth-lastname').value;
      const phone = document.getElementById('auth-phone').value;

      const res = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, firstName, lastName, phone })
      });
      state.user = res.data;
      state.token = res.accessToken;
      localStorage.setItem('estate_user', JSON.stringify(res.data));
      localStorage.setItem('estate_token', res.accessToken);
      closeAuthModal();
      updateAuthUI();
      showToast(`Account created! Logged in as ${res.data.email}`);
      showView('properties');
    }
  } catch (err) {
    // Error handled in api()
  }
}

function handleLogout() {
  if (state.token) {
    api('/api/auth/logout', { method: 'POST' }).catch(() => {});
  }
  state.user = null;
  state.token = null;
  localStorage.removeItem('estate_user');
  localStorage.removeItem('estate_token');
  updateAuthUI();
  showToast('Logged out successfully');
  showView('properties');
}

// ================= PROPERTIES LOGIC =================
function debounceFetchProperties() {
  clearTimeout(state.debounceTimer);
  state.debounceTimer = setTimeout(fetchProperties, 300);
}

function resetFilters() {
  document.getElementById('filter-search').value = '';
  document.getElementById('filter-type').value = '';
  document.getElementById('filter-status').value = '';
  fetchProperties();
}

async function fetchProperties() {
  const search = document.getElementById('filter-search')?.value || '';
  const type = document.getElementById('filter-type')?.value || '';
  const status = document.getElementById('filter-status')?.value || '';

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (type) params.append('type', type);
  if (status) params.append('status', status);

  try {
    const res = await api(`/api/properties?${params.toString()}`);
    state.properties = res.data || [];
    renderPropertiesGrid();
  } catch (err) {
    console.error(err);
  }
}

function renderPropertiesGrid() {
  const grid = document.getElementById('properties-grid');
  const emptyState = document.getElementById('properties-empty');
  grid.innerHTML = '';

  if (state.properties.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  state.properties.forEach(prop => {
    const imgUrl = (prop.images && prop.images.length > 0) ? prop.images[0] : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800';
    const isOwner = state.user && (state.user.role === 'ADMIN' || (state.user.role === 'AGENT' && state.user.id === prop.agentId));
    const statusColor = prop.status === 'AVAILABLE' ? 'bg-emerald-500 text-white' : (prop.status === 'PENDING' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-white');

    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition group';
    card.innerHTML = `
      <div class="relative h-48 bg-slate-100 overflow-hidden">
        <img src="${imgUrl}" alt="${prop.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
        <div class="absolute top-3 left-3 flex gap-1.5">
          <span class="px-2.5 py-1 text-xs font-bold rounded-lg ${statusColor}">${prop.status}</span>
          <span class="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-900/80 text-white backdrop-blur-sm">${prop.type}</span>
        </div>
        <div class="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-lg text-white font-black text-lg">
          $${Number(prop.price).toLocaleString()}
        </div>
      </div>

      <div class="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 class="font-bold text-slate-900 text-lg group-hover:text-teal-600 transition line-clamp-1">${prop.title}</h3>
          <p class="text-xs text-slate-500 flex items-center gap-1 mt-1">
            <i class="fa-solid fa-location-dot text-teal-600"></i> ${prop.address}, ${prop.city}, ${prop.state}
          </p>
          <p class="text-xs text-slate-600 mt-2.5 line-clamp-2">${prop.description || 'No description provided.'}</p>

          <!-- Key Metrics -->
          <div class="grid grid-cols-3 gap-2 py-3 my-3 border-y border-slate-100 text-xs text-slate-600 font-medium">
            <div class="flex items-center gap-1.5"><i class="fa-solid fa-bed text-slate-400"></i> ${prop.bedrooms} Beds</div>
            <div class="flex items-center gap-1.5"><i class="fa-solid fa-bath text-slate-400"></i> ${prop.bathrooms} Baths</div>
            <div class="flex items-center gap-1.5"><i class="fa-solid fa-ruler-combined text-slate-400"></i> ${prop.area} sqft</div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-between gap-2 pt-2">
          <div class="flex items-center gap-1.5">
            <button onclick="openInquiryModal('${prop.id}', '${prop.title.replace(/'/g, "\\'")}')" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-600 hover:text-white transition flex items-center gap-1">
              <i class="fa-solid fa-envelope"></i> Inquire
            </button>
            <button onclick="toggleFavorite('${prop.id}')" class="p-2 rounded-lg text-xs bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition" title="Save Property">
              <i class="fa-solid fa-heart"></i>
            </button>
          </div>

          ${isOwner ? `
            <div class="flex items-center gap-1">
              <button onclick="editProperty('${prop.id}')" class="p-1.5 text-xs text-slate-600 hover:text-teal-600 hover:bg-slate-100 rounded" title="Edit Listing">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button onclick="deleteProperty('${prop.id}')" class="p-1.5 text-xs text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded" title="Delete Listing">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Property Modals
function openAddPropertyModal() {
  document.getElementById('modal-property-title').textContent = 'List New Property';
  document.getElementById('property-form').reset();
  document.getElementById('prop-id').value = '';
  document.getElementById('modal-property').classList.remove('hidden');
}

function closePropertyModal() {
  document.getElementById('modal-property').classList.add('hidden');
}

function editProperty(id) {
  const prop = state.properties.find(p => p.id === id);
  if (!prop) return;

  document.getElementById('modal-property-title').textContent = 'Edit Property';
  document.getElementById('prop-id').value = prop.id;
  document.getElementById('prop-title').value = prop.title;
  document.getElementById('prop-description').value = prop.description || '';
  document.getElementById('prop-type').value = prop.type;
  document.getElementById('prop-status').value = prop.status;
  document.getElementById('prop-price').value = prop.price;
  document.getElementById('prop-area').value = prop.area;
  document.getElementById('prop-bedrooms').value = prop.bedrooms;
  document.getElementById('prop-bathrooms').value = prop.bathrooms;
  document.getElementById('prop-address').value = prop.address;
  document.getElementById('prop-city').value = prop.city;
  document.getElementById('prop-state').value = prop.state;
  document.getElementById('prop-zip').value = prop.zipCode;
  document.getElementById('prop-image').value = prop.images?.[0] || '';
  document.getElementById('prop-amenities').value = prop.amenities?.join(', ') || '';

  document.getElementById('modal-property').classList.remove('hidden');
}

async function handlePropertySubmit(e) {
  e.preventDefault();
  const id = document.getElementById('prop-id').value;
  const imageVal = document.getElementById('prop-image').value;
  const amenitiesVal = document.getElementById('prop-amenities').value;

  const payload = {
    title: document.getElementById('prop-title').value,
    description: document.getElementById('prop-description').value,
    type: document.getElementById('prop-type').value,
    status: document.getElementById('prop-status').value,
    price: parseFloat(document.getElementById('prop-price').value),
    area: parseFloat(document.getElementById('prop-area').value),
    bedrooms: parseInt(document.getElementById('prop-bedrooms').value),
    bathrooms: parseFloat(document.getElementById('prop-bathrooms').value),
    address: document.getElementById('prop-address').value,
    city: document.getElementById('prop-city').value,
    state: document.getElementById('prop-state').value,
    zipCode: document.getElementById('prop-zip').value,
    images: imageVal ? [imageVal] : [],
    amenities: amenitiesVal ? amenitiesVal.split(',').map(a => a.trim()).filter(Boolean) : []
  };

  try {
    if (id) {
      await api(`/api/properties/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Property updated successfully!');
    } else {
      await api('/api/properties', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Property listed successfully!');
    }
    closePropertyModal();
    fetchProperties();
    if (state.currentView === 'agent') fetchAgentData();
  } catch (err) {
    // Handled in api()
  }
}

async function deleteProperty(id) {
  if (!confirm('Are you sure you want to delete this property?')) return;
  try {
    await api(`/api/properties/${id}`, { method: 'DELETE' });
    showToast('Property deleted successfully');
    fetchProperties();
    if (state.currentView === 'agent') fetchAgentData();
  } catch (err) {
    // Handled in api()
  }
}

// Inquiries Modal
function openInquiryModal(propId, propTitle) {
  if (!state.token) {
    showToast('Please sign in or register to send an inquiry', 'info');
    openLoginModal();
    return;
  }
  document.getElementById('inquiry-prop-id').value = propId;
  document.getElementById('inquiry-prop-title').textContent = propTitle;
  document.getElementById('inquiry-message').value = '';
  document.getElementById('modal-inquiry').classList.remove('hidden');
}

function closeInquiryModal() {
  document.getElementById('modal-inquiry').classList.add('hidden');
}

async function handleInquirySubmit(e) {
  e.preventDefault();
  const propertyId = document.getElementById('inquiry-prop-id').value;
  const message = document.getElementById('inquiry-message').value;

  try {
    await api('/api/inquiries', {
      method: 'POST',
      body: JSON.stringify({ propertyId, message })
    });
    showToast('Inquiry sent to listing agent!');
    closeInquiryModal();
  } catch (err) {
    // Handled in api()
  }
}

async function toggleFavorite(propertyId) {
  if (!state.token) {
    showToast('Please sign in to save properties to favorites', 'info');
    openLoginModal();
    return;
  }
  try {
    await api('/api/favorites', {
      method: 'POST',
      body: JSON.stringify({ propertyId })
    });
    showToast('Added to your saved favorites! ❤️');
  } catch (err) {
    // May be already in favorites, attempt remove if wanted
  }
}

// ================= AGENT DASHBOARD =================
async function fetchAgentData() {
  if (!state.token) return;
  try {
    const [dashRes, listingsRes, leadsRes] = await Promise.all([
      api('/api/agent/dashboard'),
      api('/api/agent/listings'),
      api('/api/agent/leads')
    ]);

    // Update Stats
    document.getElementById('stat-total-listings').textContent = dashRes.data.totalListings;
    document.getElementById('stat-active-listings').textContent = dashRes.data.activeListings;
    document.getElementById('stat-total-leads').textContent = dashRes.data.totalLeads;
    document.getElementById('stat-new-leads').textContent = dashRes.data.newLeads;

    // Render Leads Table
    const tbody = document.getElementById('agent-leads-tbody');
    tbody.innerHTML = '';
    const leads = leadsRes.data || [];
    if (leads.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="px-6 py-6 text-center text-slate-400">No leads assigned yet.</td></tr>`;
    } else {
      leads.forEach(lead => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition';
        tr.innerHTML = `
          <td class="px-6 py-4">
            <div class="font-semibold text-slate-900">${lead.client?.firstName || ''} ${lead.client?.lastName || ''}</div>
            <div class="text-xs text-slate-400">${lead.client?.email || ''} ${lead.client?.phone ? '• ' + lead.client.phone : ''}</div>
          </td>
          <td class="px-6 py-4">
            <div class="font-medium text-slate-800">${lead.property?.title || 'Unknown Property'}</div>
            <div class="text-xs text-slate-400">${lead.property?.city || ''}</div>
          </td>
          <td class="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">${lead.message}</td>
          <td class="px-6 py-4">
            <select onchange="updateInquiryStatus('${lead.id}', this.value)" class="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-teal-500">
              <option value="NEW" ${lead.status === 'NEW' ? 'selected' : ''}>NEW</option>
              <option value="CONTACTED" ${lead.status === 'CONTACTED' ? 'selected' : ''}>CONTACTED</option>
              <option value="IN_PROGRESS" ${lead.status === 'IN_PROGRESS' ? 'selected' : ''}>IN PROGRESS</option>
              <option value="CLOSED" ${lead.status === 'CLOSED' ? 'selected' : ''}>CLOSED</option>
            </select>
          </td>
          <td class="px-6 py-4 text-right">
            <span class="text-xs text-slate-400">${new Date(lead.createdAt).toLocaleDateString()}</span>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Render Agent Listings
    const listingsGrid = document.getElementById('agent-listings-grid');
    listingsGrid.innerHTML = '';
    const listings = listingsRes.data || [];
    if (listings.length === 0) {
      listingsGrid.innerHTML = `<div class="col-span-3 text-center py-8 text-slate-400">No managed properties found. Click "Add New Listing" to create one.</div>`;
    } else {
      listings.forEach(p => {
        const card = document.createElement('div');
        card.className = 'bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between';
        card.innerHTML = `
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="px-2 py-0.5 text-xs font-bold rounded bg-teal-50 text-teal-700">${p.type}</span>
              <span class="font-bold text-slate-900">$${Number(p.price).toLocaleString()}</span>
            </div>
            <h4 class="font-bold text-slate-900 text-base">${p.title}</h4>
            <p class="text-xs text-slate-500 mt-1">${p.address}, ${p.city}</p>
            <div class="flex items-center gap-4 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
              <span><i class="fa-solid fa-envelope text-teal-600"></i> ${p._count?.inquiries || 0} Inquiries</span>
              <span><i class="fa-solid fa-heart text-rose-500"></i> ${p._count?.favorites || 0} Saves</span>
            </div>
          </div>
          <div class="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
            <button onclick="editProperty('${p.id}')" class="flex-1 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-600 hover:text-white rounded-lg transition">Edit</button>
            <button onclick="deleteProperty('${p.id}')" class="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition">Delete</button>
          </div>
        `;
        listingsGrid.appendChild(card);
      });
    }
  } catch (err) {
    console.error(err);
  }
}

async function updateInquiryStatus(id, status) {
  try {
    await api(`/api/inquiries/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    showToast(`Lead status updated to ${status}`);
  } catch (err) {
    // Handled in api()
  }
}

// ================= ADMIN CONSOLE =================
async function fetchAdminData() {
  if (!state.token || state.user?.role !== 'ADMIN') return;
  try {
    const [usersRes, inquiriesRes] = await Promise.all([
      api('/api/users'),
      api('/api/inquiries')
    ]);

    const users = usersRes.data || [];
    const agents = users.filter(u => u.role === 'AGENT');

    // Render Users Table
    const usersTbody = document.getElementById('admin-users-tbody');
    usersTbody.innerHTML = '';
    users.forEach(u => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition';
      tr.innerHTML = `
        <td class="px-6 py-4 font-semibold text-slate-900">${u.firstName || ''} ${u.lastName || ''}</td>
        <td class="px-6 py-4 text-xs font-mono text-slate-600">${u.email}</td>
        <td class="px-6 py-4 text-xs text-slate-500">${u.phone || '—'}</td>
        <td class="px-6 py-4">
          <span class="px-2 py-0.5 text-xs font-bold rounded ${
            u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-800' : (u.role === 'AGENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800')
          }">${u.role}</span>
        </td>
        <td class="px-6 py-4">
          <select onchange="updateUserRole('${u.id}', this.value)" class="text-xs font-semibold px-2 py-1 rounded border border-slate-200 bg-white">
            <option value="CLIENT" ${u.role === 'CLIENT' ? 'selected' : ''}>CLIENT</option>
            <option value="AGENT" ${u.role === 'AGENT' ? 'selected' : ''}>AGENT</option>
            <option value="ADMIN" ${u.role === 'ADMIN' ? 'selected' : ''}>ADMIN</option>
          </select>
        </td>
        <td class="px-6 py-4 text-right">
          ${u.id !== state.user.id ? `
            <button onclick="deleteUser('${u.id}')" class="text-rose-600 hover:text-rose-800 text-xs font-semibold p-1 hover:bg-rose-50 rounded">
              <i class="fa-solid fa-trash"></i>
            </button>
          ` : '<span class="text-xs text-slate-400 italic">Self</span>'}
        </td>
      `;
      usersTbody.appendChild(tr);
    });

    // Render Admin Inquiries & Agent Assignor
    const inqTbody = document.getElementById('admin-inquiries-tbody');
    inqTbody.innerHTML = '';
    const inquiries = inquiriesRes.data || [];
    inquiries.forEach(inq => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 transition';
      tr.innerHTML = `
        <td class="px-6 py-4">
          <div class="font-semibold text-slate-900">${inq.client?.firstName || ''} ${inq.client?.lastName || ''}</div>
          <div class="text-xs text-slate-400">${inq.client?.email || ''}</div>
        </td>
        <td class="px-6 py-4 font-medium text-slate-800 text-xs">${inq.property?.title || 'Property'}</td>
        <td class="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">${inq.message}</td>
        <td class="px-6 py-4 text-xs font-medium text-slate-700">
          ${inq.agent ? `${inq.agent.firstName} ${inq.agent.lastName}` : '<span class="text-amber-600 font-semibold">Unassigned</span>'}
        </td>
        <td class="px-6 py-4">
          <span class="px-2 py-0.5 text-[11px] font-bold rounded bg-slate-100 text-slate-700">${inq.status}</span>
        </td>
        <td class="px-6 py-4 text-right">
          <select onchange="assignInquiryAgent('${inq.id}', this.value)" class="text-xs font-medium px-2 py-1 rounded border border-slate-200 bg-white">
            <option value="">-- Assign Agent --</option>
            ${agents.map(a => `<option value="${a.id}" ${inq.agentId === a.id ? 'selected' : ''}>${a.firstName} ${a.lastName} (${a.email})</option>`).join('')}
          </select>
        </td>
      `;
      inqTbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
  }
}

async function updateUserRole(userId, role) {
  try {
    await api(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });
    showToast(`User role updated to ${role}`);
    fetchAdminData();
  } catch (err) {
    // Handled in api()
  }
}

async function deleteUser(userId) {
  if (!confirm('Are you sure you want to delete this user?')) return;
  try {
    await api(`/api/users/${userId}`, { method: 'DELETE' });
    showToast('User deleted successfully');
    fetchAdminData();
  } catch (err) {
    // Handled in api()
  }
}

async function assignInquiryAgent(inquiryId, agentId) {
  if (!agentId) return;
  try {
    await api(`/api/inquiries/${inquiryId}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ agentId })
    });
    showToast('Agent assigned to inquiry successfully!');
    fetchAdminData();
  } catch (err) {
    // Handled in api()
  }
}

// ================= CLIENT FAVORITES & INQUIRIES =================
async function fetchFavoritesData() {
  if (!state.token) return;
  try {
    const [favRes, inqRes] = await Promise.all([
      api('/api/favorites'),
      api('/api/inquiries/my')
    ]);

    // Render Favorites Grid
    const favGrid = document.getElementById('favorites-grid');
    const favEmpty = document.getElementById('favorites-empty');
    favGrid.innerHTML = '';
    const favs = favRes.data || [];
    if (favs.length === 0) {
      favEmpty.classList.remove('hidden');
    } else {
      favEmpty.classList.add('hidden');
      favs.forEach(f => {
        const prop = f.property;
        if (!prop) return;
        const imgUrl = prop.images?.[0] || 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800';
        const card = document.createElement('div');
        card.className = 'bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between';
        card.innerHTML = `
          <div>
            <img src="${imgUrl}" alt="${prop.title}" class="w-full h-40 object-cover">
            <div class="p-4">
              <div class="flex items-center justify-between mb-1">
                <span class="px-2 py-0.5 text-xs font-bold rounded bg-teal-50 text-teal-700">${prop.type}</span>
                <span class="font-bold text-slate-900">$${Number(prop.price).toLocaleString()}</span>
              </div>
              <h4 class="font-bold text-slate-900 text-sm line-clamp-1">${prop.title}</h4>
              <p class="text-xs text-slate-500 mt-1">${prop.address}, ${prop.city}</p>
            </div>
          </div>
          <div class="p-4 pt-0 flex gap-2">
            <button onclick="openInquiryModal('${prop.id}', '${prop.title.replace(/'/g, "\\'")}')" class="flex-1 py-1.5 text-xs font-semibold bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition">Inquire</button>
            <button onclick="removeFavorite('${prop.id}')" class="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition" title="Remove from saved"><i class="fa-solid fa-trash"></i></button>
          </div>
        `;
        favGrid.appendChild(card);
      });
    }

    // Render My Inquiries
    const inqTbody = document.getElementById('client-inquiries-tbody');
    inqTbody.innerHTML = '';
    const inquiries = inqRes.data || [];
    if (inquiries.length === 0) {
      inqTbody.innerHTML = `<tr><td colspan="4" class="px-6 py-6 text-center text-slate-400">You have not submitted any inquiries yet.</td></tr>`;
    } else {
      inquiries.forEach(inq => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50 transition';
        tr.innerHTML = `
          <td class="px-6 py-4 font-medium text-slate-900 text-xs">${inq.property?.title || 'Property'}</td>
          <td class="px-6 py-4 text-xs text-slate-600 max-w-sm truncate">${inq.message}</td>
          <td class="px-6 py-4 text-xs text-slate-500">${inq.agent ? `${inq.agent.firstName} ${inq.agent.lastName}` : 'Pending assignment'}</td>
          <td class="px-6 py-4">
            <span class="px-2.5 py-1 text-xs font-bold rounded-lg ${
              inq.status === 'NEW' ? 'bg-amber-100 text-amber-800' : (inq.status === 'CLOSED' ? 'bg-slate-100 text-slate-700' : 'bg-teal-100 text-teal-800')
            }">${inq.status}</span>
          </td>
        `;
        inqTbody.appendChild(tr);
      });
    }
  } catch (err) {
    console.error(err);
  }
}

async function removeFavorite(propertyId) {
  try {
    await api(`/api/favorites/${propertyId}`, { method: 'DELETE' });
    showToast('Removed from favorites');
    fetchFavoritesData();
  } catch (err) {
    // Handled in api()
  }
}

// Initial Boot
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  showView('properties');
});
