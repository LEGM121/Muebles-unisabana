export type Category = 'salas' | 'comedores';

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number;
  image: string;
  colors: string[];
  measures: string[];
}

export const products: Product[] = [
  {
    id: 'sofa-nordico',
    name: 'Sofá Nórdico Oslo',
    category: 'salas',
    price: 2499,
    image: 'https://via.placeholder.com/400x280?text=Sofa+Nordico',
    colors: ['Arena', 'Grafito', 'Oliva'],
    measures: ['2.10m', '2.40m']
  },
  {
    id: 'mesa-luna',
    name: 'Mesa Comedor Luna',
    category: 'comedores',
    price: 1899,
    image: 'https://via.placeholder.com/400x280?text=Mesa+Luna',
    colors: ['Nogal', 'Roble'],
    measures: ['6 puestos', '8 puestos']
  },
  {
    id: 'modular-neo',
    name: 'Modular Neo',
    category: 'salas',
    price: 3199,
    image: 'https://via.placeholder.com/400x280?text=Modular+Neo',
    colors: ['Perla', 'Azul humo'],
    measures: ['3 módulos', '4 módulos']
  }
];
