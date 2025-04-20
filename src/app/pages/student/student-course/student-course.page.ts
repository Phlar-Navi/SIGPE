import { Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { Session } from 'src/app/components/session-list/session-list.component';

@Component({
  selector: 'app-student-course',
  templateUrl: './student-course.page.html',
  styleUrls: ['./student-course.page.scss'],
  standalone: false
})
export class StudentCoursePage implements OnInit {
  showStats: boolean = true;
  //selectedSession: number = 0;
  showAttendance: boolean = true;
  showCreateSession = false;
  isSmallScreen = false;
  isMenuOpen = false; // État du menu (ouvert/fermé)
  sessions: Session[] = [
    {
      id: 1,
      title: 'Mathématiques',
      date: '2023-10-10, 10:00',
      date_fin: '2023-10-10, 12:00',
      room: 'A101',
      description:"",
      teacher: 'Dr. Moskolai',
      status: 'À venir',
      students: []
    },
    {
      id: 2,
      title: 'Informatique',
      date: '2023-10-11, 14:00',
      date_fin: '2023-10-10, 16:00',
      room: 'B202',
      description:"",
      teacher: 'Dr. Smith',
      status: 'En cours',
      students: []
    },
    {
      id: 3,
      title: 'Physique',
      date: '2023-10-09, 08:00',
      date_fin: '2023-10-09, 10:00',
      room: 'C303',
      description:"",
      teacher: 'Dr. Dupont',
      status: 'Terminée',
      students: []
    },
  ];
  selectedSession: Session | null = null; // Variable pour stocker la session sélectionnée


  constructor() { }

  ngOnInit() {
    this.generate_charts();
  }

  onSessionSelected(sessionId: number) {
    this.selectedSession = this.sessions.find((session) => session.id === sessionId) || null;
  }

  viewStudentProfile(value: number){}

  generate_charts(){
      // Données de présence
      const presenceData = {
        labels: ["Présents", "Absents"],
        datasets: [{
          data: [80, 20],
          backgroundColor: ["#10B981", "#EF4444"],
        }],
      };
  
      // Graphique en courbes
      const canvasElement2 = document.getElementById(`sessionStatsChart`);
  
      if(canvasElement2){
        const ctx = (canvasElement2 as HTMLCanvasElement).getContext('2d');
        if(ctx){
          new Chart(ctx, {
            type: "pie",
            data: presenceData,
            options: {
              animation: {
                duration: 1000,
              },
            },
          });
        }
      }
  
    }

}
