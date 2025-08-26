 // API configuration
const API_BASE = 'https://table-tennis-backend.onrender.com/api';
 
// API functions
window.api = {
    API_BASE: API_BASE, // Expose API_BASE
    async getStudents() {
        const response = await fetch(`${API_BASE}/students`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    },
    
    async addStudent(student) {
        console.log('Adding student with data:', student);
        const response = await fetch(`${API_BASE}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(student)
        });
        
        let data;
        try {
            data = await response.json();
        } catch (e) {
            const text = await response.text();
            throw new Error(`Server error: ${text}`);
        }
        
        console.log('Add student response:', data);
        
        if (!response.ok) {
            throw new Error(data.error || `Failed to add student. Status: ${response.status}`);
        }
        
        return data;
    },

    async updateStudent(id, student) {
        if (!id) {
            throw new Error('Student ID is required for update');
        }
        
        console.log('Updating student with ID:', id, 'Data:', student);
        const response = await fetch(`${API_BASE}/students/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(student)
        });
        
        let data;
        try {
            data = await response.json();
        } catch (e) {
            const text = await response.text();
            throw new Error(`Server error: ${text}`);
        }
        
        console.log('Update student response:', data);
        
        if (!response.ok) {
            throw new Error(data.error || `Failed to update student. Status: ${response.status}`);
        }
        
        return data;
    },
    
    async deleteStudent(id) {
        if (!id) {
            throw new Error('Student ID is required for deletion');
        }
        
        console.log(`Deleting student with ID: ${id}`);
        const response = await fetch(`${API_BASE}/students/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        
        let responseData;
        try {
            responseData = await response.json();
        } catch (e) {
            const text = await response.text();
            throw new Error(`Server error: ${text}`);
        }
        
        console.log('Delete response:', responseData);
        
        if (!response.ok) {
            throw new Error(responseData.error || `Failed to delete student. Status: ${response.status}`);
        }
        
        return responseData;
    },
    
    async getPayments() {
        const response = await fetch(`${API_BASE}/payments`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    },
    
    async addPayment(payment) {
        const response = await fetch(`${API_BASE}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payment)
        });
        
        let data;
        try {
            data = await response.json();
        } catch (e) {
            const text = await response.text();
            throw new Error(`Server error: ${text}`);
        }
        
        if (!response.ok) {
            throw new Error(data.error || `Failed to add payment. Status: ${response.status}`);
        }
        
        return data;
    },

    async generateUpiQr(data) {
        const response = await fetch(`${API_BASE}/upi/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        let responseData;
        try {
            responseData = await response.json();
        } catch (e) {
            const text = await response.text();
            throw new Error(`Server error: ${text}`);
        }
        
        if (!response.ok) {
            throw new Error(responseData.error || `Failed to generate UPI QR code. Status: ${response.status}`);
        }
        
        return responseData;
    },
    
    async checkPaymentStatus(paymentId) {
        const response = await fetch(`${API_BASE}/upi/status/${paymentId}`);
        
        let responseData;
        try {
            responseData = await response.json();
        } catch (e) {
            const text = await response.text();
            throw new Error(`Server error: ${text}`);
        }
        
        if (!response.ok) {
            throw new Error(responseData.error || `Failed to check payment status. Status: ${response.status}`);
        }
        
        return responseData;
    }
};
