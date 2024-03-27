"use client";
import React, { useTransition, useState } from "react";
import Image from "next/image";
import TabButton from "./TabButton";

const TAB_DATA = [
  {
    title: "Skills",
    id: "skills",
    content: (
      <ul className="list-disc pl-2">
        <li>SolidWorks</li>
        <li>Next.js</li>
        <li>C, C++, C#</li>
        <li>Flutter</li>
        <li>JavaScript</li>
        <li>Python</li>
        <li>Altium Designer</li>
      </ul>
    ),
  },
  {
    title: "Education",
    id: "education",
    content: (
      <ul className="list-disc pl-2">
        <li>EAN University, Bogota, Colombia</li>
        <li>Mobile Developer Platzi</li>
      </ul>
    ),
  },
  {
    title: "Experience",
    id: "experience",
    content: (
      <ul className="list-disc pl-2">
        <li>Web developer</li>
        <li>Mobile developer</li>
      </ul>
    ),
  },
];

const AboutSection = () => {
  const [tab, setTab] = useState("skills");
  const [isPending, startTransition] = useTransition();

  const handleTabChange = (id) => {
    startTransition(() => {
      setTab(id);
    });
  };

  return (
    <section className="text-white" id="about">
      <div className="md:grid md:grid-cols-2 gap-8 items-center py-8 px-4 xl:gap-16 sm:py-16 xl:px-16">
        <Image src="/images/about-image.png" width={500} height={500} />
        <div className="mt-4 md:mt-0 text-left flex flex-col h-full">
          <h2 className="text-4xl font-bold text-white mb-4">About Me</h2>
          <p className="text-base lg:text-lg">
            Hi, I'm Juan Sebastian Silva Medina, a Mechatronics Engineering student 
            with experience in robotics prototyping and manufacturing and web and mobile 
            development. I have analytical and creative skills, meticulous attention to 
            detail, and excellent teamwork skills. I work with SolidWorks, Inventor and 
            perform statistical tolerance analysis to ensure accuracy in assemblies. 
            I program in several languages, such as C++, Matlab, Python, among others, 
            for microcontrollers and development boards. In addition, I have experience 
            in PCB design with Altium Designer and I am fluent in several languages. 
            My achievements include leading a team in a mobile robotics competition and 
            developing a six degrees of freedom robotic arm, using advanced optimization 
            and control techniques. I am committed to open source software and seek to 
            promote innovation in the field of robotics in developing countries.
          </p>
          <div className="flex flex-row justify-start mt-8">
            <TabButton
              selectTab={() => handleTabChange("skills")}
              active={tab === "skills"}
            >
              {" "}
              Skills{" "}
            </TabButton>
            <TabButton
              selectTab={() => handleTabChange("education")}
              active={tab === "education"}
            >
              {" "}
              Education{" "}
            </TabButton>
            <TabButton
              selectTab={() => handleTabChange("experience")}
              active={tab === "experience"}
            >
              {" "}
              Certifications{" "}
            </TabButton>
          </div>
          <div className="mt-8">
            {TAB_DATA.find((t) => t.id === tab).content}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
