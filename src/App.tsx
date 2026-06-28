/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Upload, 
  Download, 
  Database, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  FileText, 
  Plus, 
  Trash2, 
  Edit2, 
  Info, 
  FileCode, 
  Check, 
  Sliders, 
  ArrowRight, 
  X, 
  AlertTriangle, 
  Settings, 
  Layers,
  HelpCircle,
  Copy
} from "lucide-react";
import { 
  getEnterpriseDictionary, 
  saveEnterpriseDictionary, 
  suggestRename, 
  cleanFieldName, 
  DictionaryEntry 
} from "./dictionary";

interface ScannedField {
  name: string;                   // Original TDS name with brackets, e.g. "[agentname]"
  cleanName: string;              // Simplified name, e.g. "agentname"
  type: string;                   // Data type from schema (string, integer, date, boolean, etc.)
  existingCaption: string | null;  // Original caption if defined in XML, e.g. "Agent Name"
  suggestedCaption: string;        // The enterprise standard suggestion
  userCaption: string;             // Current input value
  isModified: boolean;             // True if current caption differs from original caption
  matchedBy: "dictionary" | "heuristic" | "exact";
  hasExistingColumnElement: boolean; // True if <column> existed originally in XML
}

export default function App() {
  // Application State
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([]);
  const [xmlString, setXmlString] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [scannedFields, setScannedFields] = useState<ScannedField[]>([]);
  const [originalFieldsCount, setOriginalFieldsCount] = useState<number>(0);
  
  // Navigation & View Filters
  const [activeTab, setActiveTab] = useState<"dashboard" | "dictionary" | "preview">("dashboard");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"all" | "compliant" | "needs-attention" | "suggestions">("all");
  
  // Interactive UI States
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState<boolean>(true);
  
  // Dictionary Editor States
  const [newSourcePattern, setNewSourcePattern] = useState<string>("");
  const [newTargetName, setNewTargetName] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("Sales");
  const [newDescription, setNewDescription] = useState<string>("");
  const [editingDictId, setEditingDictId] = useState<string | null>(null);

  // File Input Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Dictionary on Mount
  useEffect(() => {
    const loadedDict = getEnterpriseDictionary();
    setDictionary(loadedDict);
  }, []);

  // Update suggestions dynamically if dictionary changes
  useEffect(() => {
    if (scannedFields.length > 0) {
      const updated = scannedFields.map(field => {
        const { suggestedName, matchedBy } = suggestRename(field.name, dictionary);
        return {
          ...field,
          suggestedCaption: suggestedName,
          matchedBy,
          // If the user hasn't typed anything custom, we re-evaluate standardizations
          userCaption: field.isModified ? field.userCaption : (field.existingCaption || "")
        };
      });
      setScannedFields(updated);
    }
  }, [dictionary]);

  // Handle Notifications
  const triggerNotification = (type: "success" | "error" | "info", message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Pre-loaded sample TDS XML for instant demonstration
  const handleLoadDemo = () => {
    const demoXml = `<?xml version='1.0' encoding='utf-8' ?>
<datasource formatted-name='Federated Enterprise Sales' inline='true' source-platform='win' version='18.1'>
  <connection class='federated'>
    <named-connections>
      <named-connection name='snowflake_sales_dw'>
        <connection class='snowflake' dbname='SALES_DW' schema='PUBLIC' server='snowflake.enterprise.com' username='BI_CONSUMER' />
      </named-connection>
    </named-connections>
    <relation name='sales_agent_metrics' table='[SALES].[AGENT_METRICS]' type='table' />
    <metadata-records>
      <metadata-record class='column'>
        <remote-name>agentname</remote-name>
        <local-name>[agentname]</local-name>
        <parent-name>[sales_agent_metrics]</parent-name>
        <local-type>string</local-type>
        <aggregation>Count</aggregation>
      </metadata-record>
      <metadata-record class='column'>
        <remote-name>category</remote-name>
        <local-name>[category]</local-name>
        <parent-name>[sales_agent_metrics]</parent-name>
        <local-type>string</local-type>
        <aggregation>Count</aggregation>
      </metadata-record>
      <metadata-record class='column'>
        <remote-name>product</remote-name>
        <local-name>[product]</local-name>
        <parent-name>[sales_agent_metrics]</parent-name>
        <local-type>string</local-type>
        <aggregation>Count</aggregation>
      </metadata-record>
      <metadata-record class='column'>
        <remote-name>cust_id</remote-name>
        <local-name>[cust_id]</local-name>
        <parent-name>[sales_agent_metrics]</parent-name>
        <local-type>integer</local-type>
        <aggregation>Sum</aggregation>
      </metadata-record>
      <metadata-record class='column'>
        <remote-name>orderdate</remote-name>
        <local-name>[orderdate]</local-name>
        <parent-name>[sales_agent_metrics]</parent-name>
        <local-type>date</local-type>
        <aggregation>Year</aggregation>
      </metadata-record>
      <metadata-record class='column'>
        <remote-name>revenue_usd</remote-name>
        <local-name>[revenue_usd]</local-name>
        <parent-name>[sales_agent_metrics]</parent-name>
        <local-type>real</local-type>
        <aggregation>Sum</aggregation>
      </metadata-record>
      <metadata-record class='column'>
        <remote-name>storeid</remote-name>
        <local-name>[storeid]</local-name>
        <parent-name>[sales_agent_metrics]</parent-name>
        <local-type>string</local-type>
        <aggregation>Count</aggregation>
      </metadata-record>
      <metadata-record class='column'>
        <remote-name>isactive</remote-name>
        <local-name>[isactive]</local-name>
        <parent-name>[sales_agent_metrics]</parent-name>
        <local-type>boolean</local-type>
        <aggregation>Count</aggregation>
      </metadata-record>
      <metadata-record class='column'>
        <remote-name>customer_feedback_score</remote-name>
        <local-name>[customer_feedback_score]</local-name>
        <parent-name>[sales_agent_metrics]</parent-name>
        <local-type>real</local-type>
        <aggregation>Average</aggregation>
      </metadata-record>
    </metadata-records>
  </connection>
  <column name='[category]' datatype='string' role='dimension' type='nominal' />
</datasource>`;

    parseTdsContent(demoXml, "enterprise_sales_metrics.tds");
    triggerNotification("success", "Demo Corporate TDS source loaded successfully.");
  };

  // Parsing logical fields out of the XML document
  const parseTdsContent = (xmlContent: string, name: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "application/xml");
      
      // Check for parsing errors
      const parserError = xmlDoc.querySelector("parsererror");
      if (parserError) {
        throw new Error("Invalid XML layout. Please ensure it is a valid Tableau TDS file.");
      }

      setXmlString(xmlContent);
      setFileName(name);

      // 1. Scan metadata-records which contain physical table columns
      const metadataColumns: { name: string; type: string }[] = [];
      const records = xmlDoc.querySelectorAll("metadata-record");
      
      records.forEach(record => {
        const isColumn = record.getAttribute("class") === "column" || record.querySelector("local-name");
        if (isColumn) {
          const localNameNode = record.querySelector("local-name");
          const localTypeNode = record.querySelector("local-type");
          if (localNameNode) {
            const fieldName = localNameNode.textContent || "";
            if (fieldName && !metadataColumns.some(c => c.name === fieldName)) {
              metadataColumns.push({
                name: fieldName,
                type: localTypeNode ? (localTypeNode.textContent || "string") : "string"
              });
            }
          }
        }
      });

      // 2. Scan top-level customized column tags
      const datasource = xmlDoc.querySelector("datasource") || xmlDoc.documentElement;
      const columnNodes = Array.from(datasource.children).filter(node => node.tagName === "column");
      const xmlCustomColumns = new Map<string, { caption: string | null; type: string | null }>();
      
      columnNodes.forEach(node => {
        const colName = node.getAttribute("name");
        if (colName) {
          xmlCustomColumns.set(colName, {
            caption: node.getAttribute("caption"),
            type: node.getAttribute("datatype")
          });
        }
      });

      // 3. Assemble complete unique list of scanned fields
      const allFieldNames = new Set([
        ...metadataColumns.map(c => c.name),
        ...Array.from(xmlCustomColumns.keys())
      ]);

      const parsedFields: ScannedField[] = Array.from(allFieldNames).map(rawName => {
        const clean = cleanFieldName(rawName);
        const metadataInfo = metadataColumns.find(c => c.name === rawName);
        const customColInfo = xmlCustomColumns.get(rawName);

        const type = metadataInfo?.type || customColInfo?.type || "string";
        const existingCaption = customColInfo ? customColInfo.caption : null;

        const { suggestedName, matchedBy } = suggestRename(rawName, dictionary);

        return {
          name: rawName,
          cleanName: clean,
          type,
          existingCaption,
          suggestedCaption: suggestedName,
          userCaption: existingCaption || "",
          isModified: false,
          matchedBy,
          hasExistingColumnElement: xmlCustomColumns.has(rawName)
        };
      });

      setOriginalFieldsCount(parsedFields.length);
      setScannedFields(parsedFields);
      triggerNotification("success", `Scanned ${parsedFields.length} data source fields.`);
    } catch (err: any) {
      console.error(err);
      triggerNotification("error", err.message || "Failed to parse the TDS file.");
    }
  };

  // Upload/Drag & Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith(".tds") || file.name.endsWith(".xml")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            parseTdsContent(event.target.result as string, file.name);
          }
        };
        reader.readAsText(file);
      } else {
        triggerNotification("error", "Only Tableau Data Source (.tds) or raw XML files are accepted.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          parseTdsContent(event.target.result as string, file.name);
        }
      };
      reader.readAsText(file);
    }
  };

  // Update caption for a single field
  const handleFieldCaptionChange = (name: string, value: string) => {
    const updated = scannedFields.map(field => {
      if (field.name === name) {
        return {
          ...field,
          userCaption: value,
          isModified: value !== (field.existingCaption || "")
        };
      }
      return field;
    });
    setScannedFields(updated);
  };

  // Quick action: accept a single suggestion
  const handleApplySingleSuggestion = (name: string) => {
    const field = scannedFields.find(f => f.name === name);
    if (field) {
      handleFieldCaptionChange(name, field.suggestedCaption);
    }
  };

  // Quick action: accept ALL suggestions
  const handleAutoRenameAll = () => {
    const updated = scannedFields.map(field => {
      const standardCaption = field.suggestedCaption;
      return {
        ...field,
        userCaption: standardCaption,
        isModified: standardCaption !== (field.existingCaption || "")
      };
    });
    setScannedFields(updated);
    triggerNotification("success", "Applied obvious data dictionary standards to all fields.");
  };

  // Revert all edits back to original file captions
  const handleResetEdits = () => {
    const reverted = scannedFields.map(field => ({
      ...field,
      userCaption: field.existingCaption || "",
      isModified: false
    }));
    setScannedFields(reverted);
    triggerNotification("info", "All workspace modifications reverted to raw file state.");
  };

  // Compile modified fields back into original XML document
  const generateModifiedXml = (): string => {
    if (!xmlString) return "";
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "application/xml");
    const datasource = xmlDoc.querySelector("datasource") || xmlDoc.documentElement;

    const afterTags = [
      "column-instance",
      "group",
      "mapped-images",
      "drill-paths",
      "unlinked-server-hierarchies",
      "folders-common",
      "folders-parameters",
      "actions",
      "calculated-members",
      "extract",
      "layout",
      "style",
      "semantic-values",
      "date-options",
      "default-date-format",
      "default-sorts",
      "field-sort-info",
      "datasource-dependencies",
      "explainability",
      "filter",
      "object-graph"
    ];

    const insertColumnElement = (newCol: Element) => {
      const existingColumns = Array.from(datasource.children).filter(
        child => child.tagName.toLowerCase() === "column"
      );
      if (existingColumns.length > 0) {
        const lastCol = existingColumns[existingColumns.length - 1];
        lastCol.insertAdjacentElement("afterend", newCol);
        return;
      }

      const children = Array.from(datasource.children);
      const insertBeforeNode = children.find(child => 
        afterTags.includes(child.tagName.toLowerCase())
      );

      if (insertBeforeNode) {
        datasource.insertBefore(newCol, insertBeforeNode);
      } else {
        datasource.appendChild(newCol);
      }
    };

    scannedFields.forEach(field => {
      const trimmedCaption = field.userCaption.trim();
      let colElement = xmlDoc.querySelector(`column[name='${field.name}'], column[name="${field.name}"]`);

      if (trimmedCaption !== "") {
        if (!colElement) {
          colElement = xmlDoc.createElement("column");
          colElement.setAttribute("name", field.name);
          
          let datatype = "string";
          let role = "dimension";
          let typeAttr = "nominal";

          const lowType = field.type.toLowerCase();
          if (lowType.includes("int") || lowType === "integer") {
            datatype = "integer";
            role = "measure";
            typeAttr = "quantitative";
          } else if (lowType.includes("real") || lowType === "double" || lowType === "float") {
            datatype = "real";
            role = "measure";
            typeAttr = "quantitative";
          } else if (lowType.includes("date") || lowType === "datetime") {
            datatype = "date";
            role = "dimension";
            typeAttr = "ordinal";
          } else if (lowType.includes("bool") || lowType === "boolean") {
            datatype = "boolean";
            role = "dimension";
            typeAttr = "nominal";
          }
          
          colElement.setAttribute("datatype", datatype);
          colElement.setAttribute("role", role);
          colElement.setAttribute("type", typeAttr);
          
          insertColumnElement(colElement);
        } else {
          // Ensure existing column elements also have the required 'type' attribute if missing
          if (!colElement.getAttribute("type")) {
            const roleAttr = colElement.getAttribute("role") || "dimension";
            const datatypeAttr = colElement.getAttribute("datatype") || "string";
            let typeAttr = "nominal";
            if (roleAttr === "measure" || datatypeAttr === "integer" || datatypeAttr === "real") {
              typeAttr = "quantitative";
            } else if (datatypeAttr === "date" || datatypeAttr === "datetime") {
              typeAttr = "ordinal";
            }
            colElement.setAttribute("type", typeAttr);
          }
        }
        
        colElement.setAttribute("caption", trimmedCaption);
      } else {
        if (colElement) {
          colElement.removeAttribute("caption");
          if (colElement.attributes.length <= 1) {
            colElement.remove();
          }
        }
      }
    });

    const serializer = new XMLSerializer();
    let serialized = serializer.serializeToString(xmlDoc);

    if (!serialized.startsWith("<?xml")) {
      serialized = `<?xml version='1.0' encoding='utf-8' ?>\n` + serialized;
    }
    return serialized;
  };

  // Download Modified TDS file
  const handleExportTds = () => {
    try {
      const compiledXml = generateModifiedXml();
      if (!compiledXml) return;

      const blob = new Blob([compiledXml], { type: "application/xml;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      const newName = fileName.replace(/\.tds$/, "") + "_standardized.tds";
      link.href = url;
      link.setAttribute("download", newName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      triggerNotification("success", `Successfully exported ${newName}! Ready for Tableau.`);
    } catch (e) {
      console.error(e);
      triggerNotification("error", "Failed to generate standardized TDS file.");
    }
  };

  // Add field rule to Data Dictionary
  const handleAddDictionaryEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourcePattern.trim() || !newTargetName.trim()) {
      triggerNotification("error", "Source Pattern and Target Standard Name are required.");
      return;
    }

    const cleanPattern = newSourcePattern.trim().toLowerCase();
    
    if (dictionary.some(item => item.sourcePattern.toLowerCase() === cleanPattern && item.id !== editingDictId)) {
      triggerNotification("error", `A standard rule for "${cleanPattern}" already exists.`);
      return;
    }

    if (editingDictId) {
      const updated = dictionary.map(item => {
        if (item.id === editingDictId) {
          return {
            ...item,
            sourcePattern: cleanPattern,
            targetName: newTargetName.trim(),
            category: newCategory,
            description: newDescription.trim()
          };
        }
        return item;
      });
      setDictionary(updated);
      saveEnterpriseDictionary(updated);
      setEditingDictId(null);
      triggerNotification("success", "Dictionary rule updated successfully.");
    } else {
      const newEntry: DictionaryEntry = {
        id: Date.now().toString(),
        sourcePattern: cleanPattern,
        targetName: newTargetName.trim(),
        category: newCategory,
        description: newDescription.trim()
      };
      const updated = [...dictionary, newEntry];
      setDictionary(updated);
      saveEnterpriseDictionary(updated);
      triggerNotification("success", "New enterprise data dictionary standard added.");
    }

    setNewSourcePattern("");
    setNewTargetName("");
    setNewDescription("");
  };

  // Edit dictionary rule
  const handleStartEditDict = (entry: DictionaryEntry) => {
    setEditingDictId(entry.id);
    setNewSourcePattern(entry.sourcePattern);
    setNewTargetName(entry.targetName);
    setNewCategory(entry.category || "Sales");
    setNewDescription(entry.description || "");
  };

  // Cancel editing dictionary
  const handleCancelEditDict = () => {
    setEditingDictId(null);
    setNewSourcePattern("");
    setNewTargetName("");
    setNewDescription("");
  };

  // Delete dictionary rule
  const handleDeleteDictEntry = (id: string) => {
    const filtered = dictionary.filter(item => item.id !== id);
    setDictionary(filtered);
    saveEnterpriseDictionary(filtered);
    triggerNotification("info", "Dictionary rule removed.");
  };

  // Reset dictionary to factory defaults
  const handleRestoreDefaultDict = () => {
    if (window.confirm("Restore factory enterprise dictionary standards? This will clear custom rules.")) {
      localStorage.removeItem("enterprise_data_dictionary");
      const loaded = getEnterpriseDictionary();
      setDictionary(loaded);
      triggerNotification("info", "Data dictionary restored to original enterprise defaults.");
    }
  };

  // Copy sample column tag to clipboard
  const handleCopyTagToClipboard = (field: ScannedField, index: number) => {
    const tag = `<column name='${field.name}' caption='${field.userCaption || field.suggestedCaption}' />`;
    navigator.clipboard.writeText(tag);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Filters scanned fields for rendering
  const filteredFields = scannedFields.filter(field => {
    const matchesSearch = 
      field.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      field.cleanName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      field.userCaption.toLowerCase().includes(searchQuery.toLowerCase()) ||
      field.suggestedCaption.toLowerCase().includes(searchQuery.toLowerCase());

    const isCurrentlyCompliant = field.userCaption.trim().toLowerCase() === field.suggestedCaption.trim().toLowerCase();
    const hasSuggestedDifference = field.suggestedCaption !== (field.existingCaption || field.cleanName);

    if (filterStatus === "compliant") {
      return matchesSearch && isCurrentlyCompliant && field.userCaption !== "";
    }
    if (filterStatus === "needs-attention") {
      return matchesSearch && !isCurrentlyCompliant;
    }
    if (filterStatus === "suggestions") {
      return matchesSearch && hasSuggestedDifference && !isCurrentlyCompliant;
    }
    return matchesSearch;
  });

  // Calculate statistics
  const totalFields = scannedFields.length;
  const compliantCount = scannedFields.filter(f => f.userCaption.trim().toLowerCase() === f.suggestedCaption.trim().toLowerCase()).length;
  const nonStandardCount = totalFields - compliantCount;
  const matchRate = totalFields > 0 ? Math.round((compliantCount / totalFields) * 100) : 0;
  const draftChangesCount = scannedFields.filter(f => f.isModified).length;

  return (
    <div className="h-screen w-full bg-slate-50 font-sans flex flex-col overflow-hidden antialiased">
      {/* Top Banner Notification */}
      {notification && (
        <div 
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-lg border text-sm max-w-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
            notification.type === "success" 
              ? "bg-emerald-50 text-emerald-800 border-emerald-100 shadow-emerald-100/40" 
              : notification.type === "error" 
                ? "bg-rose-50 text-rose-800 border-rose-100 shadow-rose-100/40"
                : "bg-blue-50 text-blue-800 border-blue-100 shadow-blue-100/40"
          }`}
          role="alert"
        >
          {notification.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
          {notification.type === "error" && <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />}
          {notification.type === "info" && <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />}
          <span className="font-medium">{notification.message}</span>
          <button 
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-600 ml-auto flex-shrink-0 p-1 rounded-md hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <header className="h-16 bg-[#1f2937] border-b border-slate-700 flex items-center justify-between px-8 text-white shadow-sm flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold text-lg italic text-white shadow-sm shadow-blue-500/30">
            T
          </div>
          <div>
            <h1 className="text-base font-bold leading-none tracking-tight">TDS Architect Pro</h1>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-mono">Enterprise Tableau Data Source Governance</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-mono">Enterprise Dictionary</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Connected: v2.4.0
            </span>
          </div>
          <div className="h-8 w-px bg-slate-700"></div>
          {xmlString ? (
            <button 
              onClick={handleExportTds}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Export XML (TDS)
            </button>
          ) : (
            <button 
              onClick={handleLoadDemo}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded text-xs font-semibold transition-colors cursor-pointer"
            >
              Load Demo TDS
            </button>
          )}
        </div>
      </header>

      {/* Middle Workspace Area (Sidebar + Main) */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar Left Nav & Context */}
        <aside className="w-64 bg-slate-100 border-r border-slate-200 p-6 flex flex-col justify-between flex-shrink-0 overflow-y-auto">
          <div className="space-y-8">
            {/* Tab Navigation Menu */}
            <nav className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 italic">
                Workspace Views
              </div>
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-blue-50 text-blue-600 shadow-2xs border-l-4 border-blue-600"
                    : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
                }`}
              >
                <Sliders className="w-4 h-4 flex-shrink-0" />
                <span>Field Standardizer</span>
                {scannedFields.length > 0 && (
                  <span className="ml-auto bg-slate-200 text-slate-700 font-mono px-1.5 py-0.5 rounded text-[10px]">
                    {scannedFields.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("dictionary")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "dictionary"
                    ? "bg-blue-50 text-blue-600 shadow-2xs border-l-4 border-blue-600"
                    : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
                }`}
              >
                <Database className="w-4 h-4 flex-shrink-0" />
                <span>Enterprise Dictionary</span>
                <span className="ml-auto bg-slate-200 text-slate-700 font-mono px-1.5 py-0.5 rounded text-[10px]">
                  {dictionary.length}
                </span>
              </button>

              <button
                onClick={() => xmlString && setActiveTab("preview")}
                disabled={!xmlString}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  !xmlString
                    ? "opacity-50 cursor-not-allowed text-slate-400"
                    : activeTab === "preview"
                      ? "bg-blue-50 text-blue-600 shadow-2xs border-l-4 border-blue-600"
                      : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
                }`}
                title={!xmlString ? "Upload a file to preview XML" : ""}
              >
                <FileCode className="w-4 h-4 flex-shrink-0" />
                <span>TDS XML Raw Code</span>
              </button>
            </nav>

            {/* Workflow Progress List */}
            <nav className="space-y-4">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 italic">
                Publish Governance Workflow
              </div>
              
              <div className="space-y-3.5">
                <div className={`flex items-center gap-3 text-xs font-medium ${xmlString ? "text-emerald-600" : "text-blue-600"}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    xmlString ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                  }`}>
                    {xmlString ? "✓" : "1"}
                  </span>
                  <span>Upload TDS File</span>
                </div>

                <div className={`flex items-center gap-3 text-xs font-medium ${
                  !xmlString ? "text-slate-400" : scannedFields.length > 0 ? "text-blue-600" : "text-slate-600"
                }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    !xmlString ? "bg-slate-100 text-slate-400" : "bg-blue-100 text-blue-700"
                  }`}>
                    2
                  </span>
                  <span>Validate Field Mapping</span>
                </div>

                <div className={`flex items-center gap-3 text-xs font-medium ${
                  draftChangesCount > 0 ? "text-blue-600" : "text-slate-400"
                }`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    draftChangesCount > 0 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-300"
                  }`}>
                    3
                  </span>
                  <span>Export & Publish</span>
                </div>
              </div>
            </nav>
          </div>

          {/* Context Widget for Current File */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs mt-auto">
            <p className="text-[10px] font-bold text-slate-800 mb-2 uppercase tracking-tight font-mono">Current Metadata Source</p>
            {xmlString ? (
              <div className="space-y-2">
                <p className="text-xs text-blue-600 font-mono break-all font-semibold leading-tight">
                  {fileName}
                </p>
                <div className="h-px bg-slate-100 w-full" />
                <p className="text-[10px] text-slate-400 font-mono leading-none">
                  Parsed <span className="font-semibold text-slate-700">{totalFields}</span> fields in <span className="font-semibold text-slate-700">120ms</span>
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No active Tableau Data Source loaded.</p>
            )}
          </div>
        </aside>

        {/* Main Workspace Area */}
        <main className="flex-1 flex flex-col p-8 overflow-hidden">
          
          {/* Section Header */}
          <div className="mb-6 flex-shrink-0 flex items-start justify-between">
            <div>
              {activeTab === "dashboard" && (
                <>
                  <h2 className="text-2xl font-light text-slate-800 tracking-tight">
                    Data Source <span className="font-bold text-slate-900">Normalization Workspace</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Apply naming conventions and enterprise dictionary validation to physical database columns.
                  </p>
                </>
              )}
              {activeTab === "dictionary" && (
                <>
                  <h2 className="text-2xl font-light text-slate-800 tracking-tight">
                    Enterprise Data <span className="font-bold text-slate-900">Standards Dictionary</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage the master corporate directory of approved abbreviations and display names.
                  </p>
                </>
              )}
              {activeTab === "preview" && (
                <>
                  <h2 className="text-2xl font-light text-slate-800 tracking-tight">
                    TDS XML <span className="font-bold text-slate-900">Governance Code Review</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Inspect the generated XML structure with standard display caption modifications.
                  </p>
                </>
              )}
            </div>

            {/* Quick help toggle */}
            <button 
              onClick={() => setShowHowItWorks(!showHowItWorks)}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg shadow-2xs cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-blue-500" />
              <span>{showHowItWorks ? "Hide Overview" : "Show Overview"}</span>
            </button>
          </div>

          {/* Welcome Info Card */}
          {showHowItWorks && (
            <div className="mb-6 flex-shrink-0 bg-white border border-blue-100 rounded-xl p-4 shadow-2xs relative overflow-hidden transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/20 rounded-full -mr-8 -mt-8 -z-10" />
              <button 
                onClick={() => setShowHowItWorks(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800"> Tableau Developer Field Standardization Guidelines</p>
                  <p className="leading-relaxed">
                    A key best practice is hiding raw database syntax. This utility matches physical nodes (e.g. <code className="bg-slate-100 font-mono text-[10px] px-1 py-0.2 border rounded text-slate-700">agentname</code>) against custom enterprise keys and splits word patterns to suggest polished results (e.g. <code className="bg-slate-100 font-mono text-[10px] px-1 py-0.2 border rounded text-slate-700">Agent Name</code>).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* --- VIEW 1: FIELD STANDARDIZER --- */}
          {activeTab === "dashboard" && (
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              
              {!xmlString ? (
                /* Empty State Upload Form */
                <div 
                  className={`flex-1 border-2 border-dashed rounded-xl p-12 text-center transition-all flex flex-col justify-center items-center ${
                    dragActive 
                      ? "border-blue-500 bg-blue-50/40" 
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="max-w-md flex flex-col items-center">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-2xs">
                      <Upload className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      Upload Tableau Data Source (.tds)
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed">
                      Drag and drop your TDS XML file here, or browse local files to extract underlying metadata fields and begin standardization.
                    </p>
                    
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        Browse Local Files
                      </button>
                      <button 
                        onClick={handleLoadDemo}
                        className="px-4 py-2 text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
                      >
                        Load Enterprise Demo
                      </button>
                    </div>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".tds,.xml" 
                      className="hidden" 
                    />
                    
                    <p className="text-[10px] font-mono text-slate-400 mt-8">
                      Supports direct schema scanning, automated capitalization, and immediate XML download.
                    </p>
                  </div>
                </div>
              ) : (
                /* Primary Standardizer Table Container */
                <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col overflow-hidden min-h-0">
                  
                  {/* Table Control Header */}
                  <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 flex-shrink-0">
                    
                    {/* Search Field */}
                    <div className="relative w-full lg:w-72">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text"
                        placeholder="Filter fields..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-xs pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-400 font-medium"
                      />
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery("")}
                          className="text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Filter Segment Selector */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1.5">
                        Filter:
                      </span>
                      <button
                        onClick={() => setFilterStatus("all")}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer ${
                          filterStatus === "all"
                            ? "bg-slate-800 text-white"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        All ({scannedFields.length})
                      </button>
                      <button
                        onClick={() => setFilterStatus("compliant")}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                          filterStatus === "compliant"
                            ? "bg-emerald-600 text-white"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        Compliant ({compliantCount})
                      </button>
                      <button
                        onClick={() => setFilterStatus("needs-attention")}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                          filterStatus === "needs-attention"
                            ? "bg-amber-600 text-white"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <AlertCircle className="w-3 h-3" />
                        Non-Standard ({nonStandardCount})
                      </button>
                      <button
                        onClick={() => setFilterStatus("suggestions")}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors cursor-pointer flex items-center gap-1 ${
                          filterStatus === "suggestions"
                            ? "bg-blue-600 text-white"
                            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        With Renames
                      </button>
                    </div>

                    {/* Bulk Workspace tools */}
                    <div className="flex items-center gap-1.5 border-l border-slate-200 pl-4">
                      <button
                        onClick={handleAutoRenameAll}
                        className="px-2.5 py-1 text-[11px] text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 font-bold rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                        title="Accept standard dictionary renames for all fields"
                      >
                        <Sparkles className="w-3 h-3 text-blue-500" />
                        Rename All Fields
                      </button>
                      <button
                        onClick={handleResetEdits}
                        className="p-1 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-md hover:bg-slate-50"
                        title="Revert to original file captions"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Table Custom Column Header Row */}
                  <div className="bg-slate-100 border-b border-slate-200 grid grid-cols-12 text-[10px] font-bold text-slate-500 uppercase tracking-wider py-2.5 px-6 flex-shrink-0 font-mono">
                    <div className="col-span-4">Source Technical Name</div>
                    <div className="col-span-1 text-center">Type</div>
                    <div className="col-span-4">Suggested Tableau Display Name</div>
                    <div className="col-span-3 text-right">Dictionary Match</div>
                  </div>

                  {/* Scrollable list body */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-0">
                    {filteredFields.length === 0 ? (
                      <div className="py-16 text-center text-slate-400">
                        <Layers className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-400" />
                        <p className="font-semibold text-slate-700">No matching fields found</p>
                        <p className="text-xs text-slate-400 mt-1">Try resetting filters or adjusting search queries</p>
                      </div>
                    ) : (
                      filteredFields.map((field, idx) => {
                        const isCompliant = field.userCaption.trim().toLowerCase() === field.suggestedCaption.trim().toLowerCase();
                        
                        // Parse display type representation
                        let typeLabel = "ABC";
                        let typeColor = "text-blue-500";
                        if (field.type.includes("int") || field.type.includes("real") || field.type.includes("double")) {
                          typeLabel = "#";
                          typeColor = "text-emerald-600";
                        } else if (field.type.includes("date")) {
                          typeLabel = "📅";
                          typeColor = "text-indigo-600";
                        } else if (field.type.includes("bool")) {
                          typeLabel = "T/F";
                          typeColor = "text-rose-600";
                        }

                        return (
                          <div 
                            key={field.name} 
                            className={`grid grid-cols-12 py-3 px-6 items-center hover:bg-slate-50/50 transition-all ${
                              isCompliant ? "bg-emerald-50/10" : "bg-blue-50/10"
                            }`}
                          >
                            {/* Column 1: Source Technical Name */}
                            <div className="col-span-4 flex flex-col justify-center min-w-0 pr-4">
                              <span className="font-mono text-xs font-semibold text-slate-600 truncate select-all" title={field.name}>
                                {field.name}
                              </span>
                              {field.existingCaption && (
                                <span className="text-[10px] text-slate-400 italic">
                                  Original caption: "{field.existingCaption}"
                                </span>
                              )}
                            </div>

                            {/* Column 2: Type Center */}
                            <div className={`col-span-1 text-center font-bold text-xs ${typeColor}`}>
                              {typeLabel}
                            </div>

                            {/* Column 3: Display Name Caption Input */}
                            <div className="col-span-4 flex items-center gap-2">
                              <div className="relative flex-1">
                                <input 
                                  type="text"
                                  placeholder={field.suggestedCaption}
                                  value={field.userCaption}
                                  onChange={(e) => handleFieldCaptionChange(field.name, e.target.value)}
                                  className="w-full border-b border-slate-200 bg-transparent text-sm font-semibold focus:outline-none focus:border-blue-600 py-1 text-slate-800 placeholder:text-slate-400 placeholder:italic transition-colors"
                                />
                                {field.userCaption && (
                                  <button
                                    onClick={() => handleFieldCaptionChange(field.name, "")}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                                    title="Reset to default raw name"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>

                              {/* Suggestion Quick Button if not compliant */}
                              {!isCompliant && (
                                <button
                                  onClick={() => handleApplySingleSuggestion(field.name)}
                                  className="p-1 hover:bg-blue-50 text-blue-600 rounded-lg transition-all border border-transparent hover:border-blue-100"
                                  title={`Apply suggestion: "${field.suggestedCaption}"`}
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Clipboard tag copy */}
                              <button
                                onClick={() => handleCopyTagToClipboard(field, idx)}
                                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                                title="Copy TDS XML column tag"
                              >
                                {copiedIndex === idx ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            {/* Column 4: Dictionary Validation Match Status */}
                            <div className="col-span-3 text-right">
                              {isCompliant ? (
                                <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold uppercase tracking-wider">
                                  PERFECT MATCH
                                </span>
                              ) : (
                                <button 
                                  onClick={() => handleApplySingleSuggestion(field.name)}
                                  className="inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-800 hover:bg-amber-200 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                                  title="Click to apply standard"
                                >
                                  RENAME AVAILABLE
                                </button>
                              )}
                            </div>

                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Table workspace summary footer */}
                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0">
                    <div className="text-xs text-slate-500 font-medium">
                      <span className="font-bold text-slate-700">Governance Status:</span>{" "}
                      {compliantCount} standard compliant, {nonStandardCount} raw fields. {draftChangesCount > 0 && `${draftChangesCount} local draft updates ready.`}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button 
                        onClick={handleResetEdits}
                        className="flex-1 sm:flex-initial px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                      >
                        Reset Mappings
                      </button>
                      <button 
                        onClick={handleAutoRenameAll}
                        className="flex-1 sm:flex-initial px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                      >
                        Apply Auto-Corrections
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {/* --- VIEW 2: ENTERPRISE DATA DICTIONARY --- */}
          {activeTab === "dictionary" && (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden min-h-0">
              
              {/* Form panel: Add / Edit standard rules */}
              <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col justify-between overflow-y-auto">
                <div className="space-y-4">
                  <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 font-display">
                      <Database className="w-4 h-4 text-blue-600" />
                      {editingDictId ? "Modify Standard Rule" : "Add Standard Rule"}
                    </h3>
                    {editingDictId && (
                      <button 
                        onClick={handleCancelEditDict}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleAddDictionaryEntry} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                        Source Pattern / Physical Field
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. agentname, product_id"
                        value={newSourcePattern}
                        onChange={(e) => setNewSourcePattern(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                        disabled={!!editingDictId}
                      />
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        Case-insensitive. Ignores brackets when matched against metadata fields.
                      </p>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                        Enterprise Approved Display Name
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. Agent Name, Product ID"
                        value={newTargetName}
                        onChange={(e) => setNewTargetName(e.target.value)}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                        Domain Category
                      </label>
                      <select 
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-medium"
                      >
                        <option value="Agent">Agent Mappings</option>
                        <option value="Customer">Customer Metadata</option>
                        <option value="Product">Product Details</option>
                        <option value="Sales">Sales & Transactions</option>
                        <option value="System">System & Keys</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                        Business Definition / Context
                      </label>
                      <textarea 
                        placeholder="Define standard usage or metadata properties..."
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        rows={3}
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {editingDictId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      {editingDictId ? "Save Standard Rule" : "Add Enterprise Standard"}
                    </button>
                  </form>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 bg-amber-50/40 p-3 rounded-lg text-[10px] text-amber-900 leading-normal">
                  <div className="flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <div>
                      <span className="font-bold">Tableau Governance Rule:</span> All database columns must be validated against corporate vocabularies prior to Server publication.
                    </div>
                  </div>
                </div>
              </div>

              {/* Inventory database list */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col overflow-hidden min-h-0">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm font-display">Standards Inventory</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Approved dictionary terms for published Tableau Data Sources.</p>
                  </div>
                  <button
                    onClick={handleRestoreDefaultDict}
                    className="text-[10px] font-bold text-slate-600 hover:text-slate-800 border border-slate-200 bg-white px-2.5 py-1.5 rounded shadow-2xs"
                  >
                    Restore Defaults
                  </button>
                </div>

                {/* Grid Item Inventory scroll container */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 min-h-0">
                  {dictionary.map(item => (
                    <div key={item.id} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-100/30 px-2 py-0.5 rounded">
                            {item.sourcePattern}
                          </code>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="font-bold text-slate-800 text-xs">
                            {item.targetName}
                          </span>
                          {item.category && (
                            <span className="text-[9px] font-bold text-slate-400 border border-slate-200/60 rounded px-1.5 uppercase tracking-wide bg-slate-50 font-mono">
                              {item.category}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-slate-500 leading-relaxed truncate-2-lines">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Right list edits */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEditDict(item)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title="Edit rule"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDictEntry(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* --- VIEW 3: TDS RAW CODE PREVIEW --- */}
          {activeTab === "preview" && xmlString && (
            <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col overflow-hidden min-h-0">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm font-display">TDS XML Document Code</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Review generated customized `column` caption parameters.</p>
                </div>
                <button
                  onClick={handleExportTds}
                  className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download XML File
                </button>
              </div>

              {/* Code Pre Container */}
              <div className="flex-1 bg-slate-900 text-slate-100 p-5 font-mono text-xs overflow-auto selection:bg-slate-800">
                <pre className="font-mono text-left select-all leading-normal">
                  {generateModifiedXml()}
                </pre>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Corporate System Footer */}
      <footer className="h-12 bg-white border-t border-slate-200 flex items-center justify-between px-8 text-[11px] text-slate-400 flex-shrink-0 font-mono">
        <div className="flex gap-4">
          <span>Version: 3.2.1-Stable</span>
          <span>&bull;</span>
          <span>Log: TDS Parser Initialized</span>
        </div>
        <div className="flex items-center gap-2 font-semibold text-slate-600">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          System Governance Ready
        </div>
      </footer>
    </div>
  );
}
