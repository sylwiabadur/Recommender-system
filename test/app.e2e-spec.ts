import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { Repository } from 'typeorm';
import { User } from './../src/users/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersRatings } from './../src/users/usersRatings.entity';
import { Movie } from './../src/movies/movie.entity';
import { Category } from './../src/categories/category.entity';
import { AbScenario, UserTestResult } from './testHelpers/AbScenario';
import moviesJson from './../src/common/movies.json';
import usersJson from './../src/common/users.json';
import ratingsJson from './../src/common/ratings.json';
import { UsersService } from './../src/users/users.service';
import { UsersRepoHelperService } from './../src/users/usersRepoHelper.service';
import * as csv from 'fast-csv';
import * as fs from 'fs';
import { MoviesRepoHelperService } from './../src/movies/moviesRepoHelper.service';
import { MoviesService } from './../src/movies/movies.service';
import { JsonRating } from './testHelpers/JsonRatingsInterface';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let usersRepo: Repository<User>;
  let ratingsRepo: Repository<UsersRatings>;
  let categoriesRepo: Repository<Category>;
  let moviesRepo: Repository<Movie>;

  let abscenario: AbScenario;
  let usersRepoHelper: UsersRepoHelperService;
  let userService: UsersService;
  let moviesRepoHelper: MoviesRepoHelperService;
  let moviesService: MoviesService;

  beforeEach(async () => {
    jest.setTimeout(1000 * 20000);
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    usersRepo = app.get<Repository<User>>(getRepositoryToken(User));
    ratingsRepo = app.get<Repository<UsersRatings>>(
      getRepositoryToken(UsersRatings),
    );
    categoriesRepo = app.get<Repository<Category>>(
      getRepositoryToken(Category),
    );
    moviesRepo = app.get<Repository<Movie>>(getRepositoryToken(Movie));

    abscenario = new AbScenario(
      usersRepo,
      ratingsRepo,
      moviesRepo,
      categoriesRepo,
    );
    usersRepoHelper = new UsersRepoHelperService(
      usersRepo,
      ratingsRepo,
      moviesRepo,
    );
    userService = new UsersService(
      usersRepoHelper,
      usersRepo,
      ratingsRepo,
      moviesRepo,
    );
    moviesRepoHelper = new MoviesRepoHelperService(moviesRepo);
    moviesService = new MoviesService(moviesRepo, ratingsRepo, userService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  async function runTestProcedureForOneUserUser(
    oneUser: User,
  ): Promise<UserTestResult[]> {
    const byPercentage = 0.1;
    const by = oneUser.ratings.length * byPercentage;

    const userTestResults: UserTestResult[] = [];
    const deletedAll: UsersRatings[] = [];

    let prev = 0;
    for (let i = 1; i <= 5; i++) {
      const curr = prev + by;
      if (Math.floor(prev) == Math.floor(curr)) {
        prev = curr;
        continue;
      }
      prev = curr;

      const deletedRatings = await abscenario.reduceUserRatings(
        oneUser,
        Math.ceil(by),
      );
      deletedAll.push(...deletedRatings);
      const result = await abscenario.getPredictedRatingsForUserUser(
        oneUser,
        userService,
        deletedAll,
      );
      const movieTestResults = abscenario.getEstimateAndValueToCompare(
        result,
        deletedAll,
      );
      const userTestResult: UserTestResult = {
        movieTestResults,
        reducedByPercentage: byPercentage * i,
        reducedByNumber: by * i,
        ...abscenario.countMseAndRmseAndMAE(result, deletedAll),
      };
      userTestResults.push(userTestResult);
    }
    return userTestResults;
  }

  // async function runTestProcedureForOneUserItemItem(
  //   oneUser: User,
  // ): Promise<UserTestResult[]> {
  //   const byPercentage = 0.1;
  //   const by = oneUser.ratings.length * byPercentage;

  //   const userTestResults: UserTestResult[] = [];
  //   const deletedAll: UsersRatings[] = [];

  //   let prev = 0;
  //   for (let i = 1; i <= 5; i++) {
  //     const curr = prev + by;
  //     if (Math.floor(prev) == Math.floor(curr)) {
  //       prev = curr;
  //       continue;
  //     }
  //     prev = curr;

  //     const deletedRatings = await abscenario.reduceUserRatings(
  //       oneUser,
  //       Math.ceil(by),
  //     );
  //     deletedAll.push(...deletedRatings);
  //     const result = await abscenario.getPredictedRatingsForUserItemItem(
  //       oneUser,
  //       moviesService,
  //       deletedAll,
  //     );
  //     const movieTestResults = abscenario.getEstimateAndValueToCompare(
  //       result,
  //       deletedAll,
  //     );
  //     const userTestResult: UserTestResult = {
  //       movieTestResults,
  //       reducedByPercentage: byPercentage * i,
  //       reducedByNumber: by * i,
  //       ...abscenario.countMseAndRmseAndMAE(result, deletedAll),
  //     };
  //     userTestResults.push(userTestResult);
  //   }
  //   return userTestResults;
  // }

  // it(`should pass`, () => {
  //   expect(true).toEqual(true);
  // });

  // it('complex test for one user and save to csv when user-user', async done => {
  //   await abscenario.clearRepos();
  //   await abscenario.fillRepos(
  //     moviesJson,
  //     usersJson,
  //     ratingsJson as JsonRating[],
  //   );

  //   const usersPercentage = await abscenario.getUsersPercentage();
  //   const oneUser = usersPercentage[38];
  //   const userTestResults = await runTestProcedureForOneUserUser(oneUser);

  //   const csvStream = csv.format({ headers: true });
  //   const wStream = fs.createWriteStream(
  //     'outOneUserCaseUserUser39IdEuclid.csv',
  //   );
  //   csvStream.pipe(wStream).on('end', () => console.log('END'));
  //   for (let i = 0; i < userTestResults.length; i++) {
  //     for (let j = 0; j < userTestResults[i].movieTestResults.length; j++) {
  //       csvStream.write({
  //         predicted: userTestResults[i].movieTestResults[j].predicted,
  //         real: userTestResults[i].movieTestResults[j].real,
  //         reducedByNumber: userTestResults[i].reducedByNumber,
  //         reducedByPercent: userTestResults[i].reducedByPercentage,
  //         MSEValue: userTestResults[i].mse,
  //         RMSEValue: userTestResults[i].rmse,
  //         MAEValue: userTestResults[i].mae,
  //       });
  //     }
  //   }
  //   csvStream.end();
  //   done();
  // });

  // it('complex test for many users and save to csv', async done => {
  //   await abscenario.clearRepos();
  //   await abscenario.fillRepos(
  //     moviesJson,
  //     usersJson,
  //     ratingsJson as JsonRating[],
  //   );
  //   const resultsMultipleUsers: UserTestResult[][] = []; //(usertestresult[])[] for many users
  //   // const usersPercent = 0.2;
  //   // const totalUsers = await usersRepo.count();
  //   // const n = Math.ceil(totalUsers * usersPercent);
  //   const ids = [
  //     3,
  //     5,
  //     8,
  //     9,
  //     14,
  //     36,
  //     44,
  //     72,
  //     148,
  //     155,
  //     185,
  //     188,
  //     203,
  //     253,
  //     255,
  //     271,
  //     276,
  //     295,
  //     327,
  //     347,
  //     358,
  //     371,
  //     378,
  //     398,
  //     400,
  //     402,
  //     441,
  //     444,
  //     454,
  //     456,
  //     501,
  //     506,
  //     537,
  //     540,
  //   ];
  //   const n = 32;
  //   for (let i = 0; i < n; i++) {
  //     const user = await usersRepo.findOne({
  //       where: { externalId: ids[i] },
  //       relations: ['ratings', 'ratings.movie'],
  //     });
  //     resultsMultipleUsers.push(await runTestProcedureForOneUserUser(user));
  //     await abscenario.clearRepos();
  //     await abscenario.fillRepos(
  //       moviesJson,
  //       usersJson,
  //       ratingsJson as JsonRating[],
  //     );
  //   }
  //   const globalSumMSE = [0, 0, 0, 0, 0];
  //   const globalSumMAE = [0, 0, 0, 0, 0];
  //   const nProc = [0, 0, 0, 0, 0];
  //   let diff = 0;

  //   for (let i = 0; i < n; i++) {
  //     for (let j = 0; j < resultsMultipleUsers[i].length; j++) {
  //       for (let percent = 1; percent <= 5; percent++) {
  //         if (resultsMultipleUsers[i][j].reducedByPercentage == 0.1 * percent) {
  //           for (
  //             let k = 0;
  //             k < resultsMultipleUsers[i][j].movieTestResults.length;
  //             k++
  //           ) {
  //             diff = Math.abs(
  //               Number(
  //                 resultsMultipleUsers[i][j].movieTestResults[k].predicted,
  //               ) - Number(resultsMultipleUsers[i][j].movieTestResults[k].real),
  //             );
  //             globalSumMAE[percent - 1] += diff;
  //             globalSumMSE[percent - 1] += Math.pow(diff, 2);
  //             nProc[percent - 1]++;
  //           }
  //         }
  //       }
  //     }
  //   }
  //   const csvStream = csv.format({ headers: true });
  //   const wStream = fs.createWriteStream('outManyUsersMseRmseUserUserk16.csv');
  //   csvStream.pipe(wStream).on('end', () => console.log('END'));
  //   for (let i = 0; i < 5; i++) {
  //     csvStream.write({
  //       reducedByPercent: (i + 1) / 10,
  //       MSEValue: globalSumMSE[i] / nProc[i],
  //       RMSEValue: Math.sqrt(globalSumMSE[i] / nProc[i]),
  //       MAEValue: globalSumMAE[i] / nProc[i],
  //     });
  //   }
  //   csvStream.end();
  //   done();
  // });

  // it('complex test for one user and save to csv when item-item', async done => {
  //   await abscenario.clearRepos();
  //   await abscenario.fillRepos(
  //     moviesJson,
  //     usersJson,
  //     ratingsJson as JsonRating[],
  //   );

  //   const usersPercentage = await abscenario.getUsersPercentage();
  //   const oneUser = usersPercentage[38];
  //   const userTestResults = await runTestProcedureForOneUserItemItem(oneUser);

  //   const csvStream = csv.format({ headers: true });
  //   const wStream = fs.createWriteStream(
  //     'outOneUserCaseItemItemId39Pearson.csv',
  //   );
  //   csvStream.pipe(wStream).on('end', () => console.log('END'));
  //   for (let i = 0; i < userTestResults.length; i++) {
  //     for (let j = 0; j < userTestResults[i].movieTestResults.length; j++) {
  //       csvStream.write({
  //         predicted: userTestResults[i].movieTestResults[j].predicted,
  //         real: userTestResults[i].movieTestResults[j].real,
  //         reducedByNumber: userTestResults[i].reducedByNumber,
  //         reducedByPercent: userTestResults[i].reducedByPercentage,
  //         MSEValue: userTestResults[i].mse,
  //         RMSEValue: userTestResults[i].rmse,
  //         MAEValue: userTestResults[i].mae,
  //       });
  //     }
  //   }
  //   done();
  //   csvStream.end();
  // });

  // it('complex test for many users and save to csv, Item-Item', async done => {
  //   await abscenario.clearRepos();
  //   await abscenario.fillRepos(
  //     moviesJson,
  //     usersJson,
  //     ratingsJson as JsonRating[],
  //   );
  //   const resultsMultipleUsers: UserTestResult[][] = []; //(usertestresult[])[] for many users
  //   // const usersPercent = 0.6;
  //   // const totalUsers = await usersRepo.count();

  //   // const n = Math.ceil(totalUsers * usersPercent);
  //   const n = 32;
  //   const ids = [
  //     3,
  //     5,
  //     8,
  //     9,
  //     14,
  //     36,
  //     44,
  //     72,
  //     148,
  //     155,
  //     185,
  //     188,
  //     203,
  //     253,
  //     255,
  //     271,
  //     276,
  //     295,
  //     327,
  //     347,
  //     358,
  //     371,
  //     378,
  //     398,
  //     400,
  //     402,
  //     441,
  //     444,
  //     454,
  //     456,
  //     501,
  //     506,
  //     537,
  //     540,
  //   ];
  //   for (let i = 0; i < n; i++) {
  //     const user = await usersRepo.findOne({
  //       relations: ['ratings', 'ratings.movie'],
  //       where: { externalId: ids[i] },
  //     });
  //     resultsMultipleUsers.push(await runTestProcedureForOneUserItemItem(user));
  //     await abscenario.clearRepos();
  //     await abscenario.fillRepos(
  //       moviesJson,
  //       usersJson,
  //       ratingsJson as JsonRating[],
  //     );
  //   }
  //   const globalSumMSE = [0, 0, 0, 0, 0];
  //   const nProc = [0, 0, 0, 0, 0];
  //   const globalSumMAE = [0, 0, 0, 0, 0];
  //   let diff = 0;

  //   for (let i = 0; i < n; i++) {
  //     for (let j = 0; j < resultsMultipleUsers[i].length; j++) {
  //       for (let percent = 1; percent <= 5; percent++) {
  //         if (resultsMultipleUsers[i][j].reducedByPercentage == 0.1 * percent) {
  //           for (
  //             let k = 0;
  //             k < resultsMultipleUsers[i][j].movieTestResults.length;
  //             k++
  //           ) {
  //             diff = Math.abs(
  //               Number(
  //                 resultsMultipleUsers[i][j].movieTestResults[k].predicted,
  //               ) - Number(resultsMultipleUsers[i][j].movieTestResults[k].real),
  //             );
  //             globalSumMAE[percent - 1] += diff;
  //             globalSumMSE[percent - 1] += Math.pow(diff, 2);
  //             nProc[percent - 1]++;
  //           }
  //         }
  //       }
  //     }
  //   }
  //   const csvStream = csv.format({ headers: true });
  //   const wStream = fs.createWriteStream(
  //     'outManyUsersMseRmseItemItem32pearson.csv',
  //   );
  //   csvStream.pipe(wStream).on('end', () => console.log('END'));
  //   for (let i = 0; i < 5; i++) {
  //     csvStream.write({
  //       reducedByPercent: (i + 1) / 10,
  //       MSEValue: globalSumMSE[i] / nProc[i],
  //       RMSEValue: Math.sqrt(globalSumMSE[i] / nProc[i]),
  //       MAEValue: globalSumMAE[i] / nProc[i],
  //     });
  //   }
  //   csvStream.end();
  //   done();
  // });
});
