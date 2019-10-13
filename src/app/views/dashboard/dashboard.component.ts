import {Component, OnInit} from '@angular/core';
import {getStyle, hexToRgba} from '@coreui/coreui/dist/js/coreui-utilities';
import {CustomTooltips} from '@coreui/coreui-plugin-chartjs-custom-tooltips';
import {ApiService} from '../../services/api.service';
import {MarkdownService} from 'ngx-markdown';
import {Router} from '@angular/router';
import {AuthenticationService} from '../../_services';
import {User} from '../../_models';
import {ChallengeActive} from '../../_models/challengeActive';
import {Title} from '@angular/platform-browser';
import {MatomoService} from '../../services/matomo.service';
import {CordovaService} from '../../services/cordova.service';
import {Observable} from 'rxjs';
import {AppVersion} from '../../_models/appVersion';

@Component({
  templateUrl: 'dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  currentUser: User;
  profileAvatar: string;
  isLoading: boolean;
  loading: number;
  loadingExpected: number;
  cordovaService$: CordovaService;
  cordovaUpdateAvailable: AppVersion;

  intraDayWidgetChartOptions: any;
  intraDayWidgetChartColours: any;
  intraDayWidgetChartLegend: boolean;
  intraDayWidgetChartType: string;

  widgetsOnFirstRow: number;
  widgetGridOnFirstRow: string;

  widgetGridMilestonesRow: string;
  milestonesMoreWidgetEnable: boolean;
  theMilestonesMore: Array<string>;
  milestonesLessWidgetEnable: boolean;
  theMilestonesLess: Array<string>;

  awardsWidgetEnable: boolean;
  awardsSummaries: Array<any>;

  stepWidgetEnable: boolean;
  stepIntraDayWidgetEnable: boolean;
  stepSummary: number;
  stepSummaryGoal: number;
  stepSummaryPercentage: number;
  stepSummaryPercentageBar: number;
  stepIntraDayChartData: Array<any>;
  stepIntraDayChartLabels: Array<any>;

  floorWidgetEnable: boolean;
  floorIntraDayWidgetEnable: boolean;
  floorSummary: number;
  floorSummaryGoal: number;
  floorSummaryPercentage: number;
  floorSummaryPercentageBar: number;
  floorIntraDayChartData: Array<any>;
  floorIntraDayChartLabels: Array<any>;

  distanceWidgetEnable: boolean;
  distanceIntraDayWidgetEnable: boolean;
  distanceSummary: number;
  distanceSummaryGoal: number;
  distanceSummaryPercentage: number;
  distanceSummaryPercentageBar: number;
  distanceUnits: string;
  distanceIntraDayChartData: Array<any>;
  distanceIntraDayChartLabels: Array<any>;

  weightWidgetEnable: boolean;
  weightIntraDayWidgetEnable: boolean;
  weightCurrent: number;
  weightCurrentUnit: string;
  weightPercentage: number;
  weightWidgetChartOptions: any;
  weightWidgetChartColours: any;
  weightWidgetChartLegend: boolean;
  weightWidgetChartType: string;
  weightWidgetChartData: Array<any>;
  weightWidgetChartLabels: Array<any>;
  weightWidgetChartSince: string;

  rpgChallengeEnable: boolean;
  rpgChallengeSummary: { win: number; lose: number; draw: number };
  rpgChallengeRunning: Array<ChallengeActive>;

  constructor(private authenticationService: AuthenticationService,
              private router: Router,
              private titleService: Title,
              private markdownService: MarkdownService,
              private apiService: ApiService,
              private _matomoService: MatomoService,
              private _cordovaService: CordovaService) {
    this.cordovaService$ = _cordovaService;
    this.setDefaultChartOptions();
    this.loadingExpected = 9;
  }

  ngOnInit(): void {
    this.loading = 0;
    this.isLoading = true;
    this.authenticationService.currentUser.subscribe(x => this.currentUser = x);
    this._matomoService.setupTracking('Core | Dashboard');
    this._matomoService.setCustomVariable('apiCalls', this.loadingExpected.toString(), 'page');
    if (this.currentUser.firstrun) {
      this.router.navigate(['/setup/profile']);
    } else {
      this.loadFromApi();
    }

    this.cordovaService$.updateAvailable.subscribe(x => this.cordovaUpdateAvailable = x);
  }

  pullToRefresh(): void {
    this._matomoService.trackEvent('core', 'api', 'cache', 0);
    this.buildViewContent(true);
  }

  loadFromApi(): void {
    this._matomoService.trackEvent('core', 'api', 'cache', 1);
    this.buildViewContent(false);
  }

  buildViewContent(bustCache?: boolean): void {
    this.loading = 0;
    this.widgetsOnFirstRow = 0;
    this.widgetGridOnFirstRow = 'col-12 col-md-6 col-lg-4 col-xl-3';
    this.stepWidgetEnable = false;
    this.stepIntraDayWidgetEnable = false;
    this.floorWidgetEnable = false;
    this.floorIntraDayWidgetEnable = false;
    this.distanceWidgetEnable = false;
    this.distanceIntraDayWidgetEnable = false;
    this.rpgChallengeEnable = false;
    this.milestonesMoreWidgetEnable = false;
    this.milestonesLessWidgetEnable = false;
    this.awardsWidgetEnable = false;
    this.weightWidgetEnable = false;
    this.weightIntraDayWidgetEnable = false;
    this.awardsSummaries = [];
    this.widgetGridMilestonesRow = 'col-12 col-md-6';

    this.apiService.getProfile(bustCache).subscribe((data) => {
      this.profileAvatar = data['avatar'];
      this.emitApiLoaded();
    });

    this.apiService.getDashboard(bustCache).subscribe((data) => {
      if (data['steps']) {
        this._matomoService.setCustomVariable('apiAvailabilitySteps', 'true', 'page');

        this.addWidgetToFirstRow();

        this.stepSummary = data['steps']['value'];
        this.stepSummaryGoal = data['steps']['goal'];
        this.stepSummaryPercentage = data['steps']['progress'];
        this.stepSummaryPercentageBar = data['steps']['progressBar'];
        this.stepWidgetEnable = true;

        if (data['steps']['intraDay']) {
          this._matomoService.setCustomVariable('apiAvailabilitySteps', 'intraDay', 'page');

          this.stepIntraDayChartData = [];
          this.stepIntraDayChartData.push(data['steps']['intraDay']['widget']['data']);
          this.stepIntraDayChartLabels = data['steps']['intraDay']['widget']['labels'];
          this.stepIntraDayWidgetEnable = true;
        }

      }
      this.emitApiLoaded();

      if (data['floors']) {
        this._matomoService.setCustomVariable('apiAvailabilityFloors', 'true', 'page');

        this.addWidgetToFirstRow();

        this.floorSummary = data['floors']['value'];
        this.floorSummaryGoal = data['floors']['goal'];
        this.floorSummaryPercentage = data['floors']['progress'];
        this.floorSummaryPercentageBar = data['floors']['progressBar'];
        this.floorWidgetEnable = true;

        if (data['floors']['intraDay']) {
          this._matomoService.setCustomVariable('apiAvailabilityFloors', 'intraDay', 'page');

          this.floorIntraDayChartData = [];
          this.floorIntraDayChartData.push(data['floors']['intraDay']['widget']['data']);
          this.floorIntraDayChartLabels = data['floors']['intraDay']['widget']['labels'];
          this.floorIntraDayWidgetEnable = true;
        }
      }
      this.emitApiLoaded();

      if (data['distance']) {
        this._matomoService.setCustomVariable('apiAvailabilityDistance', 'true', 'page');

        this.addWidgetToFirstRow();

        this.distanceSummary = data['distance']['value'];
        this.distanceSummaryGoal = data['distance']['goal'];
        this.distanceSummaryPercentage = data['distance']['progress'];
        this.distanceSummaryPercentageBar = data['distance']['progressBar'];
        this.distanceWidgetEnable = true;
        this.distanceUnits = data['distance']['units'];

        if (data['distance']['intraDay']) {
          this._matomoService.setCustomVariable('apiAvailabilityDistance', 'intraDay', 'page');

          this.distanceIntraDayChartData = [];
          this.distanceIntraDayChartData.push(data['distance']['intraDay']['widget']['data']);
          this.distanceIntraDayChartLabels = data['distance']['intraDay']['widget']['labels'];
          this.distanceIntraDayWidgetEnable = true;
        }
      }
      this.emitApiLoaded();

      if (data['weight']) {
        this._matomoService.setCustomVariable('apiAvailabilityWeight', 'true', 'page');

        this.addWidgetToFirstRow();

        this.weightCurrent = data['weight']['value'];
        this.weightCurrentUnit = data['weight']['unit'];
        this.weightPercentage = data['weight']['progress'];

        this.weightWidgetChartData = [];
        this.weightWidgetChartData.push(data['weight']['widget']['data'][2]);
        this.weightWidgetChartLabels = data['weight']['widget']['labels'];
        if (this.weightWidgetChartData.length > 0) {
          this.weightIntraDayWidgetEnable = true;
        }

        this.weightWidgetEnable = true;
      }
      this.emitApiLoaded();

      this.rpgChallengeSummary = {
        win: data['rpg_challenge_friends']['score']['win'],
        lose: data['rpg_challenge_friends']['score']['lose'],
        draw: data['rpg_challenge_friends']['score']['draw'],
      };
      this.emitApiLoaded();

      this.rpgChallengeRunning = [];
      for (let i = 0; i < data['rpg_challenge_friends']['running'].length; i++) {
        this.rpgChallengeRunning.push(data['rpg_challenge_friends']['running'][i]);
      }
      if (
        this.rpgChallengeSummary.win > 0 ||
        this.rpgChallengeSummary.lose > 0 ||
        this.rpgChallengeSummary.draw > 0 ||
        this.rpgChallengeRunning.length > 0
      ) {
        this.rpgChallengeEnable = true;
      }
      this.emitApiLoaded();

      if (data['milestones']) {
        this.theMilestonesMore = [];
        if (data['milestones']['distance']['more']) {
          for (let i = 0; i < data['milestones']['distance']['more'].length; i++) {
            this.theMilestonesMore.push(this.markdownString(data['milestones']['distance']['more'][i]));
          }
          if (this.theMilestonesMore.length > 0) {
            this.milestonesMoreWidgetEnable = true;
          }
        }

        this.theMilestonesLess = [];
        if (data['milestones']['distance']['less']) {

          for (let i = 0; i < data['milestones']['distance']['less'].length; i++) {
            this.theMilestonesLess.push(this.markdownString(data['milestones']['distance']['less'][i]));
          }
          if (this.theMilestonesLess.length > 0) {
            this.milestonesLessWidgetEnable = true;
          }
        }

        if (this.milestonesMoreWidgetEnable && this.milestonesLessWidgetEnable) {
          this.widgetGridMilestonesRow = 'col-12 col-md-6 d-none d-lg-block';
        } else if (this.milestonesMoreWidgetEnable || this.milestonesLessWidgetEnable) {
          this.widgetGridMilestonesRow = 'col-12 d-none d-lg-block';
        }
      }
      this.emitApiLoaded();

      this.awardsSummaries = [];
      if (data['awards']) {
        this.awardsSummaries = Object.keys(data['awards']).map(it => data['awards'][it]);
        if (this.awardsSummaries.length > 0) {
          this.awardsWidgetEnable = true;
        }
      }

      this.emitApiLoaded();
    });

  }

  private setDefaultChartOptions() {
    this.intraDayWidgetChartOptions = {
      tooltips: {
        enabled: false,
        custom: CustomTooltips
      },
      maintainAspectRatio: false,
      scales: {
        xAxes: [{
          display: false
        }],
        yAxes: [{
          display: false
        }]
      },
      elements: {
        line: {
          borderWidth: 2
        },
        point: {
          radius: 0,
          hitRadius: 10,
          hoverRadius: 4,
        },
      },
      legend: {
        display: false
      }
    };
    this.intraDayWidgetChartColours = [
      {
        backgroundColor: 'rgba(255,255,255,.2)',
        borderColor: 'rgba(255,255,255,.55)',
      }
    ];
    this.intraDayWidgetChartLegend = false;
    this.intraDayWidgetChartType = 'bar';

    this.weightWidgetChartOptions = {
      tooltips: {
        enabled: false,
        custom: CustomTooltips,
        intersect: true,
        mode: 'index',
        position: 'nearest',
        callbacks: {
          labelColor: function (tooltipItem, chart) {
            return {backgroundColor: chart.data.datasets[tooltipItem.datasetIndex].borderColor};
          }
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        xAxes: [{
          gridLines: {
            drawOnChartArea: false,
          }
        }],
        yAxes: [{
          ticks: {
            beginAtZero: false,
            maxTicksLimit: 5,
            max: 1,
            min: 0
          }
        }]
      },
      elements: {
        line: {
          borderWidth: 2
        },
        point: {
          radius: 0,
          hitRadius: 10,
          hoverRadius: 4,
          hoverBorderWidth: 3,
        }
      },
      legend: {
        display: false
      }
    };
    this.weightWidgetChartColours = [
      { // brandInfo
        backgroundColor: hexToRgba(getStyle('--info'), 10),
        borderColor: getStyle('--info'),
        pointHoverBackgroundColor: '#fff'
      },
      { // brandSuccess
        backgroundColor: 'transparent',
        borderColor: getStyle('--success'),
        pointHoverBackgroundColor: '#fff'
      }
    ];
    this.weightWidgetChartLegend = false;
    this.weightWidgetChartType = 'line';
  }

  private addWidgetToFirstRow() {
    this.widgetsOnFirstRow++;
    switch (this.widgetsOnFirstRow) {
      case 1:
        this.widgetGridOnFirstRow = 'col-12';
        break;
      case 2:
        this.widgetGridOnFirstRow = 'col-12 col-md-6';
        break;
      case 3:
        this.widgetGridOnFirstRow = 'col-12 col-md-4';
        break;
      case 4:
        this.widgetGridOnFirstRow = 'col-12 col-md-6 col-lg-4 col-xl-3';
        break;
    }
  }

  private markdownString(datumElementElement: string) {
    return this.markdownService.compile(datumElementElement).replace('<p>', '').replace('</p>', '');
  }

  awardClicked(id: number) {
    this._matomoService.trackEvent('detail', 'click', 'award', id);
    this.router.navigate(['/achievements/awards/info', id]);
  }

  viewChallenge(id: any) {
    this._matomoService.trackEvent('detail', 'click', 'challenge', id);
    this.router.navigate(['/rpg/challenges/info', id]);
  }

  private emitApiLoaded() {
    this.loading++;
    if (this.loading >= this.loadingExpected) {
      this._matomoService.doTracking();
    }
  }
}

