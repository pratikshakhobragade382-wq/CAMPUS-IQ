import "./IndexPage.css";

import Navbar from "./Navbar/Navbar";
import Hero from "./Hero/Hero";
import Roles from "./Roles Section/roles";
import Tags from "./Tags/Tags";
import Card from "./Card/Card";
import Footer from "./Footer/Footer";

function IndexPage() {
  return (
    <>
      <Navbar />

      <Hero />

      <Roles />

      <Tags />

      <Card />

      <Footer/>
    </>
  );
}

export default IndexPage;