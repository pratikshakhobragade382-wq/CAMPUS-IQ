import "./IndexPage.css";

import Navbar from "./Navbar/Navbar";
import Hero from "./Hero/Hero";
import Roles from "./Roles Section/Roles";
import Tags from "./Tags/Tags";
import Card from "./Card/Card";

function IndexPage() {
  return (
    <>
      <Navbar />

      <Hero />

      <Roles />

      <Tags />

      <Card />
    </>
  );
}

export default IndexPage;