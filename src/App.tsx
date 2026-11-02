import { LenisProvider } from './lib/lenis'
import { Nav } from './components/sections/Nav'
import { Hero } from './components/sections/Hero'
import { Ornament } from './components/sections/Ornament'
import { StackScene } from './components/sections/StackScene'
import { About } from './components/sections/About'
import { Process } from './components/sections/Process'
import { ProjectsIntro } from './components/sections/ProjectsIntro'
import { Projects } from './components/sections/Projects'
import { ProjectsOutro } from './components/sections/ProjectsOutro'
import { Footer } from './components/sections/Footer'
import { ScrollProgress } from './components/ui/ScrollProgress'

function App() {
  return (
    <LenisProvider>
      <ScrollProgress />
      <Nav />
      <main>
        <Hero />
        <Ornament />
        <About />
        <StackScene />
        <Process />
        <ProjectsIntro />
        <Projects />
        {/* The closing pill zoom starts from a full black screen: on desktop
            the flying cards cover that, on a phone it is just empty scrolling. */}
        <div className="hidden md:block">
          <ProjectsOutro />
        </div>
      </main>
      <Footer />
    </LenisProvider>
  )
}

export default App
