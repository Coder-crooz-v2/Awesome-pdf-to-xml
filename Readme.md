# PDF to XML Converter

A modern web application for converting PDF documents to structured XML format, built with React, TypeScript, and Node.js. [Live link](https://awesome-pdf-to-xml.vercel.app)

## Setup and Run Instructions

### Prerequisites
- Node.js (v16.0.0 or later)
- npm or yarn
- MongoDB (for backend storage)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/Coder-crooz-v2/Awesome-pdf-to-xml.git
cd pdf-to-xml
```

**2. Install dependencies**

For the client:
```bash
cd client
npm install
```

For the server:
```bash
cd server
npm install
```

**3. Environment Setup**

Create a `.env` file in the server directory:
```
PORT=8000
MONGODB_URI=your_uri
CORS_ORIGIN=http://localhost:3000
ACCESS_TOKEN_SECRET=your_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_secret
REFRESH_TOKEN_EXPIRY=10d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_secret
NODE_ENV=development
```

**4. Start the application**

Start the server:
```bash
cd server
npm run dev
```

Start the client:
```bash
cd client
npm run dev
```

The application will be available at `http://localhost:3000`

## Technology Choices and Reasoning

### Frontend
- **React**: Chosen for its component-based architecture and extensive ecosystem
- **TypeScript**: Provides static typing to catch errors early and improve code quality
- **Vite**: Fast build tool with excellent HMR capabilities
- **PDF.js**: Mozilla's powerful PDF rendering library for client-side PDF processing
- **Shadcn UI**: Modern component library built on Radix UI for accessible UI elements
- **Redux Toolkit**: For state management with a simplified approach to Redux
- **React Router**: For client-side routing with modern React features

### Backend
- **Node.js with Express**: Lightweight and flexible server framework
- **MongoDB**: NoSQL database for flexible document storage
- **Cloudinary**: Cloud storage for document files with optimization features
- **JWT Authentication**: Secure stateless authentication for API endpoints
- **Multer**: Middleware for handling multipart/form-data, used for file uploads

## Implementation Level

This project implements the **Advanced Challenge Level**, including:

- User authentication and personal document storage
- Cloud-based document storage with Cloudinary
- Complete document management system (upload, view, convert, download)
- Responsive design with dark/light mode toggle
- Conversion history tracking
- Advanced PDF text extraction with positional information

## PDF-to-XML Conversion Approach

The application uses a multi-step process for converting PDF documents to XML:

1. **Document Upload**: Users upload PDF files through the interface
2. **Text Extraction**: Using PDF.js, the application extracts text content with position coordinates, font information and other metadata
3. **Structure Analysis**: Text blocks are analyzed to identify document structure (headings, paragraphs, lists)
4. **XML Generation**: A structured XML document is created with hierarchical organization
5. **Metadata Preservation**: Document metadata (author, title, creation date) is preserved in the XML output

The conversion process specifically focuses on:
- Maintaining text hierarchy and relationships
- Preserving formatting where possible
- Handling text positioning information
- Extracting and organizing metadata

## Assumptions and Limitations

- **Document Complexity**: Works best with text-based PDFs; complex layouts or PDFs with significant graphical elements may have reduced conversion accuracy
- **Language Support**: Primarily optimized for Latin-based scripts; may have issues with right-to-left or complex scripts
- **File Size**: There's a 10MB size limit for uploaded documents to prevent server overload
- **Conversion Time**: Large documents may take longer to process, especially on slower client devices
- **Browser Compatibility**: Requires modern browsers with PDF.js support
- **OCR**: The application does not include OCR for scanned documents; it works with text-layer PDFs

## Future Improvements

Several enhancements could improve the application:

1. **OCR Integration**: Add optical character recognition for scanned documents
2. **Advanced Layout Analysis**: Improve detection of tables, columns, and other complex layouts
3. **Batch Processing Queue**: Implement a job queue for large-scale processing
4. **Custom XML Schema Support**: Allow users to define output XML structure
5. **Additional Output Formats**: Support for HTML, Markdown, and JSON output
6. **Template System**: Save and reuse conversion templates for recurring document types
7. **API Access**: Provide a developer API for programmatic access to conversion tools
8. **Performance Optimization**: Worker threads for backend processing and WebWorkers for frontend
9. **Collaborative Features**: Document sharing and team workspaces
10. **Accessibility Improvements**: Enhanced screen reader support and keyboard navigation
