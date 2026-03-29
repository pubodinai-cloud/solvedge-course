import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import MyCourses from "./pages/MyCourses";
import WatchLesson from "./pages/WatchLesson";
import PaymentSuccess from "./pages/PaymentSuccess";
import AuthPage from "./pages/AuthPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminCourseEdit from "./pages/admin/AdminCourseEdit";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminSales from "./pages/admin/AdminSales";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/courses" component={Courses} />
      <Route path="/courses/:slug" component={CourseDetail} />
      <Route path="/login">{() => <AuthPage mode="login" />}</Route>
      <Route path="/register">{() => <AuthPage mode="register" />}</Route>
      <Route path="/my-courses" component={MyCourses} />
      <Route path="/watch/:courseId/:lessonId" component={WatchLesson} />
      <Route path="/payment/success" component={PaymentSuccess} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/courses" component={AdminCourses} />
      <Route path="/admin/courses/:id" component={AdminCourseEdit} />
      <Route path="/admin/members" component={AdminMembers} />
      <Route path="/admin/sales" component={AdminSales} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
