const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

class ApiService {
  static getHeaders() {
    const token = localStorage.getItem('legallens_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }

  // 1. Auth
  static async login(email, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error('Login failed');
      const data = await res.json();
      localStorage.setItem('legallens_token', data.access_token);
      return data;
    } catch (e) {
      console.warn('Backend login fallback to demo session:', e);
      return { access_token: 'mock-token', full_name: 'R. Bhaskaran', role: 'INSPECTOR' };
    }
  }

  static async getMe() {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, { headers: this.getHeaders() });
      if (!res.ok) throw new Error('Auth check failed');
      return await res.json();
    } catch (e) {
      return { full_name: 'R. Bhaskaran', role: 'INSPECTOR', badge_number: 'LM-DL-842' };
    }
  }

  // 2. Dashboard
  static async getDashboardStats() {
    try {
      const res = await fetch(`${API_BASE}/dashboard/stats`, { headers: this.getHeaders() });
      if (!res.ok) throw new Error('Dashboard stats failed');
      return await res.json();
    } catch (e) {
      console.warn('Using local fallback stats:', e);
      return null;
    }
  }

  // 3. Inspections
  static async getInspections(params = {}) {
    try {
      const q = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/inspections?${q}`, { headers: this.getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch inspections');
      return await res.json();
    } catch (e) {
      console.warn('Using local inspections fallback:', e);
      return null;
    }
  }

  static async getInspection(id) {
    try {
      const res = await fetch(`${API_BASE}/inspections/${id}`, { headers: this.getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch inspection details');
      return await res.json();
    } catch (e) {
      console.warn('Inspection fetch fallback:', e);
      return null;
    }
  }

  static async createInspection(payload) {
    const res = await fetch(`${API_BASE}/inspections`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Inspection creation failed');
    return await res.json();
  }

  static async uploadImages(inspectionId, files, imageType = 'FRONT') {
    const formData = new FormData();
    formData.append('image_type', imageType);
    for (const f of files) {
      formData.append('files', f);
    }
    const token = localStorage.getItem('legallens_token');
    const res = await fetch(`${API_BASE}/inspections/${inspectionId}/images`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData
    });
    if (!res.ok) throw new Error('Image upload failed');
    return await res.json();
  }

  static async runScan(inspectionId) {
    const res = await fetch(`${API_BASE}/inspections/${inspectionId}/scan`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Scan execution failed');
    return await res.json();
  }

  static async processOcr(inspectionId) {
    try {
      const res = await fetch(`${API_BASE}/inspections/${inspectionId}/process-ocr`, {
        method: 'POST',
        headers: this.getHeaders()
      });
      if (!res.ok) throw new Error('OCR background process trigger failed');
      return await res.json();
    } catch (e) {
      console.warn('OCR trigger note:', e);
      return { status: 'fallback', inspection_id: inspectionId };
    }
  }

  static async getOcrStatus(inspectionId) {
    try {
      const res = await fetch(`${API_BASE}/inspections/${inspectionId}/ocr-status`, {
        headers: this.getHeaders()
      });
      if (!res.ok) throw new Error('Failed to query OCR status');
      return await res.json();
    } catch (e) {
      console.warn('OCR status query note:', e);
      return null;
    }
  }

  static async updateDeclaration(inspectionId, declId, value) {
    const res = await fetch(`${API_BASE}/inspections/${inspectionId}/declarations/${declId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ value, is_verified: true })
    });
    if (!res.ok) throw new Error('Declaration update failed');
    return await res.json();
  }

  static async submitReview(inspectionId, finalDetermination, officerNotes) {
    const res = await fetch(`${API_BASE}/inspections/${inspectionId}/review`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ final_determination: finalDetermination, officer_notes: officerNotes })
    });
    if (!res.ok) throw new Error('Review submission failed');
    return await res.json();
  }

  // 4. Reports
  static getPdfUrl(inspectionId) {
    return `${API_BASE}/reports/${inspectionId}/pdf`;
  }

  static async generateReport(inspectionId) {
    const res = await fetch(`${API_BASE}/reports/${inspectionId}/generate`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Report generation failed');
    return await res.json();
  }

  // 5. Rules
  static async getRules() {
    try {
      const res = await fetch(`${API_BASE}/rules`, { headers: this.getHeaders() });
      if (!res.ok) throw new Error('Rules fetch failed');
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  // 6. Demo Test Cases
  static async seedDemoCase(caseKey) {
    const res = await fetch(`${API_BASE}/demo/seed/${caseKey}`, {
      method: 'POST',
      headers: this.getHeaders()
    });
    if (!res.ok) throw new Error('Demo seeding failed');
    return await res.json();
  }
}

export default ApiService;
