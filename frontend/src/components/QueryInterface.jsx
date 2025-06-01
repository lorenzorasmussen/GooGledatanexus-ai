import React, { useState } from 'react'; 
 import axios from 'axios'; 
 import './QueryInterface.css'; 
 
 const QueryInterface = () => { 
   const [query, setQuery] = useState(''); 
   const [response, setResponse] = useState(null); 
   const [loading, setLoading] = useState(false); 
   const [error, setError] = useState(null); 
   const [forceAssistant, setForceAssistant] = useState(false); 
 
   const handleSubmit = async (e) => { 
     e.preventDefault(); 
     
     if (!query.trim()) return; 
     
     setLoading(true); 
     setError(null); 
     
     try { 
       const result = await axios.post('http://localhost:5001/api/pinecone-query', { 
         query, 
         forceAssistant 
       }); 
       
       setResponse(result.data); 
     } catch (err) { 
       console.error('Error submitting query:', err); 
       setError('Failed to get response. Please try again.'); 
     } finally { 
       setLoading(false); 
     } 
   }; 
 
   return ( 
     <div className="query-container"> 
       <h2>Ask a Question</h2> 
       
       <form onSubmit={handleSubmit} className="query-form"> 
         <div className="input-group"> 
           <input 
             type="text" 
             value={query} 
             onChange={(e) => setQuery(e.target.value)} 
             placeholder="Type your question here..." 
             className="query-input" 
           /> 
           <button type="submit" className="submit-button" disabled={loading}> 
             {loading ? 'Processing...' : 'Submit'} 
           </button> 
         </div> 
         
         <div className="assistant-toggle"> 
           <label> 
             <input 
               type="checkbox" 
               checked={forceAssistant} 
               onChange={() => setForceAssistant(!forceAssistant)} 
             /> 
             Always use Pinecone Assistant 
           </label> 
         </div> 
       </form> 
       
       {error && <div className="error-message">{error}</div>} 
       
       {response && ( 
         <div className="response-container"> 
           <div className="response-header"> 
             <span className="source-badge" data-source={response.source}> 
               {response.source === 'pinecone' ? 'Pinecone Assistant' : 'Default System'} 
             </span> 
           </div> 
           
           <div className="response-content"> 
             {response.response} 
           </div> 
           
           {response.citations && response.citations.length > 0 && ( 
             <div className="citations"> 
               <h4>Sources:</h4> 
               <ul> 
                 {response.citations.map((citation, index) => ( 
                   <li key={index}> 
                     {citation.references.map((ref, i) => ( 
                       <div key={i} className="citation-reference"> 
                         <span className="file-name">{ref.file.name}</span> 
                         {ref.pages && ref.pages.length > 0 && ( 
                           <span className="pages">Pages: {ref.pages.join(', ')}</span> 
                         )} 
                       </div> 
                     ))} 
                   </li> 
                 ))} 
               </ul> 
             </div> 
           )} 
         </div> 
       )} 
     </div> 
   ); 
 }; 
 
 export default QueryInterface;