import { google } from 'googleapis';

// Define the interface for our application's Product structure
export interface Product {
  id: string;
  name: string;
  url: string;
  imageUrl1: string;
  imageUrl2: string;
  originalPrice: number;
  price: number;
  stockStatus: string;
  description?: string;
}

// Configuration for Google Sheets API
const SHEET_ID = process.env.GOOGLE_SHEET_ID || '1iIbGhOmpyNSLK1WRZPK6dql0P5hg6gILWC8aJyVGcZE';
const RANGE = 'Sheet1!A2:H'; // Assuming data starts from row 2 with headers in row 1
const API_KEY = process.env.GOOGLE_API_KEY; // Optional API key for public sheets

/**
 * Convert a row from Google Sheets to our Product interface
 */
function convertRowToProduct(row: string[]): Product {
  return {
    id: row[0] || '',
    name: row[1] || '',
    url: row[2] || '',
    imageUrl1: row[3] || '',
    imageUrl2: row[4] || '',
    originalPrice: parseFloat(row[5]) || 0,
    price: parseFloat(row[6]) || 0,
    stockStatus: row[7] || '',
    description: `${row[1]} - ${row[7]}` // Creating a description from name and stock status
  };
}

/**
 * Fetch products from Google Sheet
 */
export async function fetchProductsFromSheet(): Promise<Product[]> {
  try {
    // For demonstration purposes, return mock data
    // In a real application, you would implement proper authentication
    // using either OAuth2 with refresh tokens or a service account
    console.log('Using mock data due to authentication issues');
    
    // Mock data that matches our Product interface
    return [
      { 
        id: 'P001', 
        name: "Premium Laptop", 
        url: "https://example.com/laptop",
        imageUrl1: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853",
        imageUrl2: "",
        originalPrice: 1299.99,
        price: 999.99, 
        stockStatus: "In Stock",
        description: "High-performance laptop with 16GB RAM and 512GB SSD" 
      },
      { 
        id: 'P002', 
        name: "Smartphone Pro", 
        url: "https://example.com/smartphone",
        imageUrl1: "https://images.unsplash.com/photo-1511707171634-5f897ff02ff9",
        imageUrl2: "",
        originalPrice: 899.99,
        price: 699.99, 
        stockStatus: "In Stock",
        description: "Latest smartphone with advanced camera system" 
      },
      { 
        id: 'P003', 
        name: "Wireless Headphones", 
        url: "https://example.com/headphones",
        imageUrl1: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
        imageUrl2: "",
        originalPrice: 249.99,
        price: 199.99, 
        stockStatus: "Low Stock",
        description: "Premium wireless headphones with noise cancellation" 
      },
      { 
        id: 'P004', 
        name: "Smart Watch", 
        url: "https://example.com/smartwatch",
        imageUrl1: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
        imageUrl2: "",
        originalPrice: 399.99,
        price: 349.99, 
        stockStatus: "In Stock",
        description: "Smart watch with health monitoring features" 
      },
      { 
        id: 'P005', 
        name: "Tablet Pro", 
        url: "https://example.com/tablet",
        imageUrl1: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0",
        imageUrl2: "",
        originalPrice: 599.99,
        price: 499.99, 
        stockStatus: "In Stock",
        description: "10-inch tablet with high-resolution display" 
      }
    ];

    /* 
    // This is the code that would be used with proper authentication
    const sheets = google.sheets({ version: 'v4', key: API_KEY });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    });

    const rows = response.data.values;
    
    if (!rows || rows.length === 0) {
      console.log('No data found in the Google Sheet.');
      return [];
    }

    // Convert rows to Product objects
    return rows.map(convertRowToProduct);
    */
  } catch (error) {
    console.error('Error fetching data from Google Sheet:', error);
    // Return mock data as fallback
    return [
      { 
        id: 'P001', 
        name: "Fallback Laptop", 
        url: "#",
        imageUrl1: "",
        imageUrl2: "",
        originalPrice: 1299.99,
        price: 999.99, 
        stockStatus: "In Stock",
        description: "High performance laptop" 
      },
      { 
        id: 'P002', 
        name: "Fallback Smartphone", 
        url: "#",
        imageUrl1: "",
        imageUrl2: "",
        originalPrice: 799.99,
        price: 699.99, 
        stockStatus: "In Stock",
        description: "Latest smartphone" 
      }
    ];
  }
}
