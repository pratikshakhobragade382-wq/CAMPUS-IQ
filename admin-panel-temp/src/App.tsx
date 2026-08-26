// /**
//  * Main App Component
//  * Entry point for CampusIQ application
//  */

// import React from 'react';
// import { BrowserRouter } from 'react-router-dom';
// import { ToastContainer } from 'react-toastify';
// import { AuthProvider } from './context/AuthContext';
// import { SidebarProvider } from './context/SidebarContext';
// import { ThemeProvider } from './context/ThemeContext';
// import { AppRoutes } from './routes/AppRoutes';
// import './styles/globals.css';
// import 'react-toastify/dist/ReactToastify.css';

// /**
//  * App Component
//  * Wraps the application with providers and routes
//  */
// function App() {
//   return (
//     <BrowserRouter>
//       <AuthProvider>
//         <SidebarProvider>
//           <ThemeProvider>
//             <AppRoutes />
//             <ToastContainer
//               position="top-right"
//               autoClose={3000}
//               hideProgressBar
//               closeOnClick
//               pauseOnHover
//               draggable
//             />
//                 <img className="button-icon" src={reactLogo} alt="" />
//                 Learn more
//               </a>
//             </li>
//           </ul>
//         </div>
//         <div id="social">
//           <svg className="icon" role="presentation" aria-hidden="true">
//             <use href="/icons.svg#social-icon"></use>
//           </svg>
//           <h2>Connect with us</h2>
//           <p>Join the Vite community</p>
//           <ul>
//             <li>
//               <a href="https://github.com/vitejs/vite" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#github-icon"></use>
//                 </svg>
//                 GitHub
//               </a>
//             </li>
//             <li>
//               <a href="https://chat.vite.dev/" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#discord-icon"></use>
//                 </svg>
//                 Discord
//               </a>
//             </li>
//             <li>
//               <a href="https://x.com/vite_js" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#x-icon"></use>
//                 </svg>
//                 X.com
//               </a>
//             </li>
//             <li>
//               <a href="https://bsky.app/profile/vite.dev" target="_blank">
//                 <svg
//                   className="button-icon"
//                   role="presentation"
//                   aria-hidden="true"
//                 >
//                   <use href="/icons.svg#bluesky-icon"></use>
//                 </svg>
//                 Bluesky
//               </a>
//             </li>
//           </ul>
//         </div>
//       </section>

//       <div className="ticks"></div>
//       <section id="spacer"></section>
//     </>
//   )
// }

// export default App
