import { collection, getDocs } from 'firebase/firestore';

import { db } from '@/lib/firebase';

export type Category = {
  id: string;
  name: string;
  icon: string;
};

let categoriesPromise: Promise<Category[]> | null = null;

export function getCategories() {
  if (!categoriesPromise) {
    categoriesPromise = getDocs(collection(db, 'categories'))
      .then((snapshot) =>
        snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
          icon: doc.data().icon,
        }))
      )
      .catch((error) => {
        categoriesPromise = null;
        throw error;
      });
  }

  return categoriesPromise;
}
