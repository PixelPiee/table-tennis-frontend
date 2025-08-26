// Database operations for the application

// Initialize Firestore
try {
    if (!firebase.apps.length) {
        console.error('Firebase not properly initialized');
    }
} catch (e) {
    console.error('Firebase initialization error:', e);
}

// Save data to Firestore
async function saveData(collectionName, data) {
    try {
        const docRef = await db.collection(collectionName).add({
            ...data,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Document written to ${collectionName} with ID:`, docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error adding document: ", error);
        throw error;
    }
}

// Get all documents from a collection
async function getAllData(collectionName) {
    try {
        const snapshot = await db.collection(collectionName)
            .orderBy('createdAt')
            .get();
            
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error("Error getting documents: ", error);
        throw error;
    }
}

// Get a single document by ID
async function getDocument(collectionName, id) {
    try {
        const doc = await db.collection(collectionName).doc(id).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error("Error getting document:", error);
        throw error;
    }
}

// Update a document
async function updateData(collectionName, id, data) {
    try {
        await db.collection(collectionName).doc(id).update({
            ...data,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Document ${id} updated in ${collectionName}`);
    } catch (error) {
        console.error("Error updating document: ", error);
        throw error;
    }
}

// Delete a document
async function deleteData(collectionName, id) {
    try {
        await db.collection(collectionName).doc(id).delete();
        console.log(`Document ${id} deleted from ${collectionName}`);
    } catch (error) {
        console.error("Error deleting document: ", error);
        throw error;
    }
}

// Student specific functions
async function saveStudent(student) {
    return await saveData('students', student);
}

async function getStudents() {
    return await getAllData('students');
}

async function updateStudent(id, studentData) {
    return await updateData('students', id, studentData);
}

async function deleteStudent(id) {
    return await deleteData('students', id);
}

// Payment specific functions
async function savePayment(payment) {
    return await saveData('payments', payment);
}

async function getPayments() {
    return await getAllData('payments');
}

async function updatePayment(id, paymentData) {
    return await updateData('payments', id, paymentData);
}

async function deletePayment(id) {
    return await deleteData('payments', id);
}

// Initialize data when the page loads
async function initializeData() {
    try {
        // Load initial data if needed
        const [students, payments] = await Promise.all([
            getStudents(),
            getPayments()
        ]);
        
        return { students, payments };
    } catch (error) {
        console.error('Error initializing data:', error);
        return { students: [], payments: [] };
    }
}
