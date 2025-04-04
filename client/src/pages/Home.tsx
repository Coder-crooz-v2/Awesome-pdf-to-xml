import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, FileText, RefreshCw, Table, List, Layers, Shield } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navbar from "@/layouts/Navbar";
import Footer from "@/layouts/Footer";

const features = [
  {
    icon: <FileText className="h-6 w-6" />,
    title: "Structure Preservation",
    description: "Maintains paragraphs, headers, and complex document structure in the conversion process."
  },
  {
    icon: <Table className="h-6 w-6" />,
    title: "Table Support",
    description: "Accurately converts tables from PDF to structured XML format."
  },
  {
    icon: <List className="h-6 w-6" />,
    title: "List Recognition",
    description: "Identifies and preserves ordered and unordered lists in your documents."
  },
  {
    icon: <Layers className="h-6 w-6" />,
    title: "Multi-page Support",
    description: "Handles documents of any length with multi-page preview and navigation."
  },
  {
    icon: <RefreshCw className="h-6 w-6" />,
    title: "Real-time Updates",
    description: "Get live conversion status as your documents are processed."
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: "Secure Storage",
    description: "Your documents are securely stored and accessible only to you."
  }
];

const HomePage = () => {
  return (
    <>
     <Navbar />
     <div className="container mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-16"
      >
        <h1 className="text-5xl font-bold tracking-tight mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          PDF to XML Converter
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Transform your PDF documents into structured XML files while preserving formatting, tables, lists, and more.
        </p>
        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <Link to="/signup">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/login">Sign In</Link>
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <Card className="h-full transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="bg-primary/10 p-3 rounded-full w-fit mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-20 text-center"
      >
        <h2 className="text-3xl font-bold mb-6">Ready to convert your documents?</h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Join thousands of users who trust our platform for their document conversion needs.
        </p>
        <Button asChild size="lg">
          <Link to="/signup">Create Your Free Account</Link>
        </Button>
      </motion.div>
    </div>
    <Footer/>
    </>
  );
};

export default HomePage;