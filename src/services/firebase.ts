import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { Student, Transaction, SchoolProfile, WhatsAppConfig, GoogleSheetsConfig } from '../types';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfigJson) : getApp();

// Initialize Firestore with specific databaseId if provided
export const db = firebaseConfigJson.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

export const COLLECTIONS = {
  STUDENTS: 'students',
  TRANSACTIONS: 'transactions',
  SETTINGS: 'settings',
};

export const SETTINGS_DOCS = {
  SCHOOL_PROFILE: 'school_profile',
  WA_CONFIG: 'wa_config',
  SHEETS_CONFIG: 'sheets_config',
  ADMIN_CONFIG: 'admin_config',
};

export const FirestoreService = {
  // --- REAL-TIME LISTENERS ---

  subscribeStudents(
    onUpdate: (students: Student[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    try {
      const colRef = collection(db, COLLECTIONS.STUDENTS);
      return onSnapshot(
        colRef,
        (snapshot) => {
          const students: Student[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Student;
            students.push({
              ...data,
              id: docSnap.id || data.id,
            });
          });
          // Sort by class and name
          students.sort((a, b) => {
            if (a.classId !== b.classId) {
              return a.classId.localeCompare(b.classId, undefined, { numeric: true });
            }
            return a.name.localeCompare(b.name);
          });
          onUpdate(students);
        },
        (error) => {
          console.warn('[Firestore] Students listener error:', error);
          if (onError) onError(error);
        }
      );
    } catch (err) {
      console.warn('[Firestore] Could not start students subscription:', err);
      return () => {};
    }
  },

  subscribeTransactions(
    onUpdate: (txs: Transaction[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    try {
      const colRef = collection(db, COLLECTIONS.TRANSACTIONS);
      const q = query(colRef, orderBy('date', 'desc'));
      return onSnapshot(
        q,
        (snapshot) => {
          const txs: Transaction[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Transaction;
            txs.push({
              ...data,
              id: docSnap.id || data.id,
            });
          });
          onUpdate(txs);
        },
        (error) => {
          console.warn('[Firestore] Transactions listener error:', error);
          if (onError) onError(error);
        }
      );
    } catch (err) {
      console.warn('[Firestore] Could not start transactions subscription:', err);
      return () => {};
    }
  },

  subscribeSettings(
    onUpdate: (settings: {
      school?: SchoolProfile;
      wa?: WhatsAppConfig;
      sheets?: GoogleSheetsConfig;
      adminPassword?: string;
    }) => void
  ): Unsubscribe {
    try {
      const colRef = collection(db, COLLECTIONS.SETTINGS);
      return onSnapshot(
        colRef,
        (snapshot) => {
          const result: {
            school?: SchoolProfile;
            wa?: WhatsAppConfig;
            sheets?: GoogleSheetsConfig;
            adminPassword?: string;
          } = {};
          snapshot.forEach((docSnap) => {
            if (docSnap.id === SETTINGS_DOCS.SCHOOL_PROFILE) {
              result.school = docSnap.data() as SchoolProfile;
            } else if (docSnap.id === SETTINGS_DOCS.WA_CONFIG) {
              result.wa = docSnap.data() as WhatsAppConfig;
            } else if (docSnap.id === SETTINGS_DOCS.SHEETS_CONFIG) {
              result.sheets = docSnap.data() as GoogleSheetsConfig;
            } else if (docSnap.id === SETTINGS_DOCS.ADMIN_CONFIG) {
              const data = docSnap.data();
              if (data?.password) result.adminPassword = data.password;
            }
          });
          onUpdate(result);
        },
        (err) => {
          console.warn('[Firestore] Settings listener error:', err);
        }
      );
    } catch (err) {
      console.warn('[Firestore] Could not start settings subscription:', err);
      return () => {};
    }
  },

  // --- CRUD OPERATIONS ---

  async saveStudent(student: Student): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.STUDENTS, student.id);
      await setDoc(docRef, student, { merge: true });
    } catch (err) {
      console.error('[Firestore] Error saving student:', err);
      throw err;
    }
  },

  async deleteStudent(studentId: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.STUDENTS, studentId);
      await deleteDoc(docRef);
    } catch (err) {
      console.error('[Firestore] Error deleting student:', err);
      throw err;
    }
  },

  async saveTransaction(tx: Transaction): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.TRANSACTIONS, tx.id);
      await setDoc(docRef, tx, { merge: true });
    } catch (err) {
      console.error('[Firestore] Error saving transaction:', err);
      throw err;
    }
  },

  async saveSchoolProfile(profile: SchoolProfile): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.SETTINGS, SETTINGS_DOCS.SCHOOL_PROFILE);
      await setDoc(docRef, profile, { merge: true });
    } catch (err) {
      console.error('[Firestore] Error saving school profile:', err);
    }
  },

  async saveWAConfig(config: WhatsAppConfig): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.SETTINGS, SETTINGS_DOCS.WA_CONFIG);
      await setDoc(docRef, config, { merge: true });
    } catch (err) {
      console.error('[Firestore] Error saving WA config:', err);
    }
  },

  async saveSheetsConfig(config: GoogleSheetsConfig): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.SETTINGS, SETTINGS_DOCS.SHEETS_CONFIG);
      await setDoc(docRef, config, { merge: true });
    } catch (err) {
      console.error('[Firestore] Error saving Sheets config:', err);
    }
  },

  async saveAdminPassword(password: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTIONS.SETTINGS, SETTINGS_DOCS.ADMIN_CONFIG);
      await setDoc(docRef, { password }, { merge: true });
    } catch (err) {
      console.error('[Firestore] Error saving admin password:', err);
    }
  },

  // Batch seed / sync all local data to cloud
  async syncLocalToCloud(
    students: Student[],
    transactions: Transaction[],
    school: SchoolProfile,
    waConfig: WhatsAppConfig,
    sheetsConfig: GoogleSheetsConfig
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Add students to batch
      for (const s of students) {
        const ref = doc(db, COLLECTIONS.STUDENTS, s.id);
        batch.set(ref, s, { merge: true });
      }

      // Add transactions to batch
      for (const tx of transactions) {
        const ref = doc(db, COLLECTIONS.TRANSACTIONS, tx.id);
        batch.set(ref, tx, { merge: true });
      }

      // Settings
      const schoolRef = doc(db, COLLECTIONS.SETTINGS, SETTINGS_DOCS.SCHOOL_PROFILE);
      batch.set(schoolRef, school, { merge: true });

      const waRef = doc(db, COLLECTIONS.SETTINGS, SETTINGS_DOCS.WA_CONFIG);
      batch.set(waRef, waConfig, { merge: true });

      const sheetsRef = doc(db, COLLECTIONS.SETTINGS, SETTINGS_DOCS.SHEETS_CONFIG);
      batch.set(sheetsRef, sheetsConfig, { merge: true });

      await batch.commit();
    } catch (err) {
      console.error('[Firestore] Error syncing local data to cloud:', err);
      throw err;
    }
  },

  // Check if cloud has data
  async checkCloudHasData(): Promise<boolean> {
    try {
      const colRef = collection(db, COLLECTIONS.STUDENTS);
      const snap = await getDocs(colRef);
      return !snap.empty;
    } catch (err) {
      console.warn('[Firestore] Error checking cloud data:', err);
      return false;
    }
  },

  // Clear all students and transactions in cloud
  async clearAllData(): Promise<void> {
    try {
      const studentSnap = await getDocs(collection(db, COLLECTIONS.STUDENTS));
      const batch = writeBatch(db);
      studentSnap.forEach((d) => batch.delete(d.ref));

      const txSnap = await getDocs(collection(db, COLLECTIONS.TRANSACTIONS));
      txSnap.forEach((d) => batch.delete(d.ref));

      await batch.commit();
    } catch (err) {
      console.error('[Firestore] Error clearing cloud data:', err);
      throw err;
    }
  },
};
